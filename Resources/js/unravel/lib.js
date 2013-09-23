CodeGraphNode = function(at, read_as) {
	this.at = at
	this.read_as = read_as || "code"
}
CodeGraphNode.prototype.trace = function(code, deep) {
	this.op = code.decode(at);
	this.flow = {
		jump: [],
		call: [],
		interrupt: [],
		data: []
	}
	var self = this;
	_.each(this.op.arrows, function(arrow) {
		switch(arrow.type){
			case "jump":
				self.flow.jump.push(code.node_at(arrow.dest, deep));
				break;
			case "call":
				self.flow.call.push(code.node_at(arrow.dest, deep));
				break;
			case "int":
				self.flow.interrupt.push(code.node_at(arrow.dest, deep));
				break;
			case "data":
				var flow = code.node_at(arrow.dest, false);
				flow.set_read_as(arrow.read_as);
				self.flow.data.push(flow);
		}
	})
}

Arrow = function(type, dest, read_as) {
	this.type = type;
	this.dest = dest;
	this.read_as = read_as || null;
}

Insn = function(mnemo, tags, at, size, info, arrows) {
	this.mnemonic = mnemo;
	this.tags = tags;
	this.at = at;
	this.size = size;
	this.info = info;
	this.arrows = arrows || [new Arrow('jump', at + size)];
}
InvalidInsn = function(at, size) {
	return new Insn("(invalid instruction)", [], at, size || 1, {}, []);
}

InsnDecoder = function(image, arch, entry_addresses) {
	this.image = image;
	this.entry_addresses = entry_addresses;
	this.arch = arch;
	this.entry_nodes = {};
	this.traced_nodes = {};
}
InsnDecoder.prototype.make_flow_graph = function() {
	var self = this;
	_.each(this.entry_addresses, function(address) {
		self.entry_nodes[address] = self.node_at(address, true);
	})
}
InsnDecoder.prototype.decode = function(at) {
	return this.arch.decode(this.image, at);
}
InsnDecoder.prototype.node_at = function(at, follow) {
	follow = follow || false;
	var self = this;
	if _.has(this.traced_nodes, at) {
		return self.traced_nodes[at];
	} else {
		var node = CodeGraphNode(at);
		if (follow) {
			self.traced_nodes[at] = node;
			node.trace(self, true);
		}
		return node;
	}
}

ArchBigEndian = function() {}
ArchBigEndian.prototype.read8 = function(image, at) {
	return image.read_byte(at);
}
ArchBigEndian.prototype.read16 = function(image, at) {
	return this.read8(image, at)*256 + this.read8(image.at+1);
}
ArchBigEndian.prototype.read32 = function(image, at) {
	return this.read16(image, at)*65536 + this.read16(image.at+2);
}
ArchBigEndian.prototype.decode = function(image, at) {
	return InvalidInsn(at);
}

ArchLittleEndian = function() {}
ArchLittleEndian.prototype.read8 = function(image, at) {
	return image.read_byte(at);
}
ArchLittleEndian.prototype.read16 = function(image, at) {
	return this.read8(image, at) + this.read8(image.at+1)*256;
}
ArchLittleEndian.prototype.read32 = function(image, at) {
	return this.read16(image, at) + this.read16(image.at+2)*65536;
}
ArchLittleEndian.prototype.decode = function(image, at) {
	return InvalidInsn(at);
}

ArchLittleEndian.prototype.readS8 = ArchBigEndian.prototype.readS8 = function(image, at) {
	var rd = this.read8(image, at);
	if (rd >= 0x80) rd -= 0x100;
	return rd;
}
ArchLittleEndian.prototype.readS16 = ArchBigEndian.prototype.readS16 = function(image, at) {
	var rd = this.read16(image, at);
	if (rd >= 0x8000) rd -= 0x10000;
	return rd;
}
ArchLittleEndian.prototype.readS32 = ArchBigEndian.prototype.readS32 = function(image, at) {
	var rd = this.read32(image, at);
	if (rd >= 0x80000000) rd -= 0x100000000;
	return rd;
}


TableMatch = function(decoder, op, at, image, table) {
	var match = _.find(table, function(row) {
		return (op & row.mask) == row.match;
	});
	if (match) {
		return match.fn(decoder, op, at, image, match);
	} else {
		return undefined;
	}
}

var Registry = function() {
	this.archs = {}
}
Registry.prototype.setArchitecture = function(name, maker) {
	this.archs[name] = maker;
}
Registry.prototype.makeArchitecture = function(name, options) {
	return this.archs[name](options)
}


registry = new Registry();
