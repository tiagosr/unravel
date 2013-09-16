var data_regs = [
	{name: 'D0', index:0, type:'data'},
	{name: 'D1', index:1, type:'data'},
	{name: 'D2', index:2, type:'data'},
	{name: 'D3', index:3, type:'data'},
	{name: 'D4', index:4, type:'data'},
	{name: 'D5', index:5, type:'data'},
	{name: 'D6', index:6, type:'data'},
	{name: 'D7', index:7, type:'data'}
]
var addr_regs = [
	{name: 'A0', index:0, type:'address'},
	{name: 'A1', index:1, type:'address'},
	{name: 'A2', index:2, type:'address'},
	{name: 'A3', index:3, type:'address'},
	{name: 'A4', index:4, type:'address'},
	{name: 'A5', index:5, type:'address'},
	{name: 'A6', index:6, type:'address'},
	{name: 'A7', index:7, type:'address', alt:'SP'}
]

var effective_address = function(decoder, op, at, image, op_mode) {
	var mode = (op & 0x38) >> 3;
	var reg = (op & 0x07);
	switch(mode) {
		case 0: return {
			type:"data_reg", source:data_regs[reg], size:0,
		 	format: function(data){
		 		return String.format("%s", data.source.name);
		 	},
		 	tags:['register', 'direct', 'data']
		};
		case 1: return {
			type:"addr_reg", source:addr_regs[reg], size:0,
			format: function(data){
		 		return String.format("%s", data.source.name);
		 	},
			tags:['register', 'direct', 'address']
		};
		case 2: return {
			type:"addr_ind", source:addr_regs[reg], size:0,
			format: function(data){
		 		return String.format("(%s)", data.source.name);
		 	},
			tags:['register', 'indirect', 'address']
		};
		case 3: return {
			type:"addr_ind_postinc", source:addr_regs[reg], size:0,
			format: function(data){
		 		return String.format("(%s)+", data.source.name);
		 	},
			tags:['register', 'indirect', 'address', 'postinc']
		};
		case 4: return {
			type:"addr_ind_predec", source:addr_regs[reg], size:0,
			format: function(data){
		 		return String.format("-(%s)", data.disp, data.source.name);
		 	},
			tags:['register', 'indirect', 'address', 'predec']
		};
		case 5: return {
			type:"addr_disp", source:addr_regs[reg], disp:decoder.read16(image, at+2), size:2,
			format: function(data){
		 		return String.format("$%x(%s)", data.disp, data.source.name);
		 	},
			tags:['register', 'indirect', 'address', 'displacement']
		};
		case 6: {
			var b = decoder.read16(image, at+2);
			var displacement = b & 0xff;
			if(displacement >= 0x80) displacement -= 0x100;
			var index_reg_type = (b & 0x8000) >> 15;
			var index_reg_index = (b & 0x7000) >> 12;
			var index_size = (b & 0x800)?{type:'long', mnemo:'.L'}:{type:'short', mnemo:{'.W'}};
			var index_reg = index_reg_type?addr_regs[index_reg_index]:data_regs[index_reg_index];

			return {
				type:"addr_ind", source:addr_regs[reg], index: index_reg, index_size:index_size, disp:displacement, size:2,
				format: function(data) {
					return String.format("$%x(%s, %s%s)", data.disp, data.source.name, data.index.name, data.index_size.mnemo);
				},
				tags:['register', 'indirect', index_reg_type?'address':'data', 'index', 'displacement']
			};
		}
		case 7: {
			switch(reg) {
				case 0: {
					var addr = decoder.readS16(image, at+2) >>> 0;
					return {
						type: "abs_short", address:addr, size:2,
						format: function(data) {
							return String.format("$%x.S", data.address);
						},
						tags:['absolute', 'direct', 'short']
					}
				}
				case 1: {
					var addr = decoder.read32(image, at+2);
					return {
						type: "abs_long", address:addr, size:4,
						format: function(data) {
							return String.format("$%x.L", data.address);
						},
						tags:['absolute', 'direct', 'long']
					}
				}
				case 2: {
					var disp = decoder.readS16(image, at+2);
					return {
						type: "pc_relative", source:{name:'PC', type:'program_counter'}, disp:disp, size: 2,
						format: function(data) {
							return String.format("$%x(PC)", data.disp);
						},
						tags:['pc_relative', 'relative', 'direct', 'displacement']
					}
				}
				case 3: {
					var b = decoder.read16(image, at+2);
					var displacement = b & 0xff;
					if(displacement >= 0x80) displacement -= 0x100;
					var index_reg_type = (b & 0x8000) >> 15;
					var index_reg_index = (b & 0x7000) >> 12;
					var index_size = (b & 0x800)?{type:'long', mnemo:'.L'}:{type:'short', mnemo:{'.W'}};
					var index_reg = index_reg_type?addr_regs[index_reg_index]:data_regs[index_reg_index];

					return {
						type:"pc_ind", source:{name:'PC', type:'program_counter'}, index: index_reg, index_size:index_size, disp:displacement, size:2,
						format: function(data) {
							return String.format("$%x(PC, %s%s)", data.disp, data.source.name, data.index.name, data.index_size.mnemo);
						},
						tags:['pc_relative', 'relative', 'indirect', index_reg_type?'address':'data', 'index', 'displacement']
					};
				}
				case 4: {
					if (op_mode == 'long') {
						var data = decoder.readS32(image, at+2);
						return {
							type: "imm", data: data, size: 2,
							format: function(data) {
								return String.format("#$%x.L",data.data);
							},
							tags:['immediate', 'data', 'long']
						}
					} else if(op_mode == 'word' || op_mode == 'byte') {
						var data = decoder.readS16(image, at+2);
						if(op_mode=='byte') data = data & 0xff;
						return {
							type: "imm", data: data, size: 2,
							format: function(data) {
								return String.format((op_mode=='word')?"#$%x.W":"#$%x.B", data.data);
							},
							tags:['immediate', 'data', op_mode]
						}
					}

				}
			}
		}
	}
	return undefined;
}

var LINK = function(decoder, op, at, image, match) {
	var reg = addr_regs[op & 0x07];
	var disp = decoder.readS16(image, at+2)
	return new Insn(
		match.mnemonic, ['link', 'push', 'stack', 'address', 'displacement', 'indirect'],
		at, 4, {reg:reg, disp:disp}
	)
}

var LEA = function(decoder, op, at, image, match) {
	var reg = addr_regs[op & 0x07];
	var ea = effective_address(decoder, op, at, image)
	return new Insn(
		match.mnemonic, ['load', 'address'],
		at, 2+ea.size, {dest:reg, source:ea}
	)
}

var Type3 = function(decoder, op, at, image, match) {
	var reg = data_regs[(op & 0xe00) >> 9];
	var op_mode = ['byte', 'word', 'long', 'invalid'][(op & 0x00c0) >> 6];
	var ea = effective_address(decoder, op, at, image, op_mode);
	var dir = (op & 0x100)>>8;
	var source = ea, dest = reg;
	if(dir) {
		source = reg; dest = ea;
	}
	return new Insn(
		match.mnemonic, _.extend(match.tags, dir?['ea->d']:['d->ea']),
		at, 2+ea.size,
		{source:source, dest:rest}
	)
}

var Type3A = function(decoder, op, at, image, match) {
	var reg = addr_regs[(op & 0xe00) >> 9];
	var op_mode = ['word', 'long'][(op & 0x0100) >> 8];
	var ea = effective_address(decoder, op, at, image, op_mode);
	return new Insn(
		match.mnemonic, _.extend(match.tags, ['ea->a']),
		at, 2+ea.size,
		{source:ea, dest:reg}
	)
}





var insn_table = [
	{mnemonic: 'abcd', match: 0xc100, mask: 0xf1f0, fn: Type14},
	{mnemonic: 'adda', match: 0xd0c0, mask: 0xf0c0, fn: Type3A, tags:['add', '+']},
	{mnemonic: 'addx', match: 0xd100, mask: 0xf130, fn: Type14},
	{mnemonic: 'add',  match: 0xd000, mask: 0xf000, fn: Type3, tags:['add', '+']},	
	{mnemonic: 'cmpm', match: 0xb108, mask: 0xf138, fn: Type19},
	{mnemonic: 'eor',  match: 0xb100, mask: 0xf100, fn: Type3, tags:['xor', '^']},
	{mnemonic: 'cmp',  match: 0xb000, mask: 0xf100, fn: Type3, tags:['compare']},

	{mnemonic: 'reset',   match: 0x4e70, mask: 0xffff, fn: Type10},
	{mnemonic: 'nop',     match: 0x4e71, mask: 0xffff, fn: Type10},
	{mnemonic: 'stop',    match: 0x4e72, mask: 0xffff, fn: Type10},
	{mnemonic: 'rte',     match: 0x4e73, mask: 0xffff, fn: Type10},
	{mnemonic: 'rts',     match: 0x4e75, mask: 0xffff, fn: Type10},
	{mnemonic: 'rtr',     match: 0x4e77, mask: 0xffff, fn: Type10},
	{mnemonic: 'trapv',   match: 0x4e76, mask: 0xffff, fn: Type10},
	{mnemonic: 'illegal', match: 0x4afc, mask: 0xffff, fn: Type10},
	
	{mnemonic: 'swap', match: 0x4840, mask: 0xfff8, fn: Type5},
	{mnemonic: 'unlk', match: 0x4e58, mask: 0xfff8, fn: Type9},
	{mnemonic: 'link', match: 0x4e50, mask: 0xfff8, fn: LINK},

	{mnemonic: 'trap', match: 0x4e40, mask: 0xfff0, fn: Type24},
	{mnemonic: 'tas',  match: 0x4ac0, mask: 0xffc0, fn: Type5},
	{mnemonic: 'jmp',  match: 0x4ec0, mask: 0xffc0, fn: Type5},
	{mnemonic: 'jsr',  match: 0x4e80, mask: 0xffc0, fn: Type5},

	{mnemonic: 'move {ea}, usp', match: 0x4e60, mask: 0xfff8, fn: Type28, direction:'reg'},
	{mnemonic: 'move usp, {ea}', match: 0x4e68, mask: 0xfff8, fn: Type28, direction:'mem'},

	{mnemonic: 'move ccr, {ea}', match: 0x42c0, mask: 0xffc0, fn: Type26, direction:'mem'},
	{mnemonic: 'move {ea}, ccr', match: 0x44c0, mask: 0xffc0, fn: Type26, direction:'reg'},
	{mnemonic: 'move sr, {ea}',  match: 0x40c0, mask: 0xffc0, fn: Type26, direction:'mem'},
	{mnemonic: 'move {ea}, sr',  match: 0x46c0, mask: 0xffc0, fn: Type26, direction:'reg'},
	
	{mnemonic: 'nbcd', match: 0x4800, mask: 0xffc0, fn: Type15},
	{mnemonic: 'pea',  match: 0x4840, mask: 0xffc0, fn: Type5},

	{mnemonic: 'ext',  match: 0x4800, mask: 0xfe30, fn: Type12},

	{mnemonic: 'movem', match: 0x4880, mask: 0xfb80, fn: Type23},
	
	{mnemonic: 'chk',  match: 0x4180, mask: 0xf1c0, fn: Type16},
	{mnemonic: 'lea',  match: 0x41c0, mask: 0xf1c0, fn: LEA},

	{mnemonic: 'tst',  match: 0x4a00, mask: 0xff00, fn: Type7},
	{mnemonic: 'clr',  match: 0x4200, mask: 0xff00, fn: Type15},
	{mnemonic: 'neg',  match: 0x4400, mask: 0xff00, fn: Type15},
	{mnemonic: 'negx', match: 0x4000, mask: 0xff00, fn: Type15},
	{mnemonic: 'not',  match: 0x4600, mask: 0xff00, fn: Type15},
	
	{mnemonic: 'dbt',  match: 0x50c8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbf',  match: 0x51c8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbhi', match: 0x52c8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbls', match: 0x53c8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbcc', match: 0x54c8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbcs', match: 0x55c8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbne', match: 0x56c8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbeq', match: 0x57c8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbvc', match: 0x58c8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbvs', match: 0x59c8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbpl', match: 0x5ac8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbmi', match: 0x5bc8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbge', match: 0x5cc8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dblt', match: 0x5dc8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dbgt', match: 0x5ec8, mask: 0xfff8, fn: Type17},
	{mnemonic: 'dble', match: 0x5fc8, mask: 0xfff8, fn: Type17},
	
	{mnemonic: 'st',   match: 0x50c0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'sf',   match: 0x51c0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'shi',  match: 0x52c0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'sls',  match: 0x53c0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'scc',  match: 0x54c0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'scs',  match: 0x55c0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'sne',  match: 0x56c0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'seq',  match: 0x57c0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'svc',  match: 0x58c0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'svs',  match: 0x59c0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'spl',  match: 0x5ac0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'smi',  match: 0x5bc0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'sge',  match: 0x5cc0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'slt',  match: 0x5dc0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'sgt',  match: 0x5ec0, mask: 0xfff8, fn: Type5},
	{mnemonic: 'sle',  match: 0x5fc0, mask: 0xfff8, fn: Type5},

	{mnemonic: 'bt',   match: 0x6000, mask: 0xff00, fn: Type8},
	{mnemonic: 'bf',   match: 0x6100, mask: 0xff00, fn: Type8},
	{mnemonic: 'bhi',  match: 0x6200, mask: 0xff00, fn: Type8},
	{mnemonic: 'bls',  match: 0x6300, mask: 0xff00, fn: Type8},
	{mnemonic: 'bcc',  match: 0x6400, mask: 0xff00, fn: Type8},
	{mnemonic: 'bcs',  match: 0x6500, mask: 0xff00, fn: Type8},
	{mnemonic: 'bne',  match: 0x6600, mask: 0xff00, fn: Type8},
	{mnemonic: 'beq',  match: 0x6700, mask: 0xff00, fn: Type8},
	{mnemonic: 'bvc',  match: 0x6800, mask: 0xff00, fn: Type8},
	{mnemonic: 'bvs',  match: 0x6900, mask: 0xff00, fn: Type8},
	{mnemonic: 'bpl',  match: 0x6a00, mask: 0xff00, fn: Type8},
	{mnemonic: 'bmi',  match: 0x6b00, mask: 0xff00, fn: Type8},
	{mnemonic: 'bge',  match: 0x6c00, mask: 0xff00, fn: Type8},
	{mnemonic: 'blt',  match: 0x6d00, mask: 0xff00, fn: Type8},
	{mnemonic: 'bgt',  match: 0x6e00, mask: 0xff00, fn: Type8},
	{mnemonic: 'ble',  match: 0x6f00, mask: 0xff00, fn: Type8},
	

	{mnemonic: 'addq', match: 0x5000, mask: 0xf100, fn: Type6},
	{mnemonic: 'muls', match: 0xc1c0, mask: 0xf1c0, fn: Type16},
	{mnemonic: 'mulu', match: 0xc0c0, mask: 0xf1c0, fn: Type16},
	

	{mnemonic: 'rol',  match: 0xe7c0, mask: 0xffc0, fn: Type11},
	{mnemonic: 'roxl', match: 0xe5c0, mask: 0xffc0, fn: Type11},
	{mnemonic: 'lsl',  match: 0xe3c0, mask: 0xffc0, fn: Type11},
	{mnemonic: 'asl',  match: 0xe100, mask: 0xf118, fn: Type11},
	{mnemonic: 'asl',  match: 0xe1c0, mask: 0xf1c0, fn: Type11},

	{mnemonic: 'ror',  match: 0xe6c0, mask: 0xffc0, fn: Type11},
	{mnemonic: 'roxr', match: 0xe4c0, mask: 0xffc0, fn: Type11},
	{mnemonic: 'lsr',  match: 0xe2c0, mask: 0xffc0, fn: Type11},
	{mnemonic: 'asr',  match: 0xe000, mask: 0xf118, fn: Type11},
	{mnemonic: 'asr',  match: 0xe0c0, mask: 0xf1c0, fn: Type11},

	{mnemonic: 'rol',  match: 0xe118, mask: 0xf118, fn: Type11},
	{mnemonic: 'ror',  match: 0xe018, mask: 0xf118, fn: Type11},
	{mnemonic: 'roxl', match: 0xe110, mask: 0xf118, fn: Type11},
	{mnemonic: 'roxr', match: 0xe010, mask: 0xf118, fn: Type11},

	{mnemonic: 'move.b', match: 0x1000, mask: 0xf000, fn: Type4},
	{mnemonic: 'move.l', match: 0x2000, mask: 0xf000, fn: Type4},
	{mnemonic: 'move.w', match: 0x3000, mask: 0xf000, fn: Type4},

	{mnemonic: 'moveq', match: 0x7000, mask: 0xf100, fn: Type22},

	{mnemonic: 'sbcd', match: 0x8100, mask: 0xf1f0, fn: Type14},
	{mnemonic: 'or',   match: 0x8000, mask: 0xf000, fn: Type3, tags:['or', '|']},

	{mnemonic: 'ori #{value}, ccr',  match: 0x003c, mask: 0xffff, fn: Type27},
	{mnemonic: 'ori #{value}, sr',   match: 0x007c, mask: 0xffff, fn: Type27},
	{mnemonic: 'ori #{value}, sr',   match: 0x007c, mask: 0xffff, fn: Type27},
	{mnemonic: 'eori #{value}, ccr', match: 0x0a3c, mask: 0xffff, fn: Type27},
	{mnemonic: 'eori #{value}, sr',  match: 0x0a7c, mask: 0xffff, fn: Type27},
	{mnemonic: 'andi #{value}, ccr', match: 0x023c, mask: 0xffff, fn: Type27},
	{mnemonic: 'andi #{value}, sr',  match: 0x027c, mask: 0xffff, fn: Type27},

	{mnemonic: 'movep.w {disp}({addr}), {data}', match: 0x0108, mask: 0xf1f8, fn: MOVEP, size: 2, direction:'mem'},
	{mnemonic: 'movep.w {data}, {disp}({addr})', match: 0x0188, mask: 0xf1f8, fn: MOVEP, size: 2, direction:'reg'},
	{mnemonic: 'movep.l {disp}({addr}), {data}', match: 0x0148, mask: 0xf1f8, fn: MOVEP, size: 4, direction:'mem'},
	{mnemonic: 'movep.l {data}, {disp}({addr})', match: 0x01c8, mask: 0xf1f8, fn: MOVEP, size: 4, direction:'reg'},
	
	{mnemonic: 'btst', match: 0x0800, mask: 0xffc0, fn: Type20},
	{mnemonic: 'bchg', match: 0x0840, mask: 0xffc0, fn: Type20},
	{mnemonic: 'bclr', match: 0x0880, mask: 0xffc0, fn: Type20},
	{mnemonic: 'bset', match: 0x08c0, mask: 0xffc0, fn: Type20},

	{mnemonic: 'ori',  match: 0x0000, mask: 0xff00, fn: Type13},
	{mnemonic: 'addi', match: 0x0600, mask: 0xff00, fn: Type13},
	{mnemonic: 'andi', match: 0x0200, mask: 0xff00, fn: Type13},
	{mnemonic: 'subi', match: 0x0400, mask: 0xff00, fn: Type13},
	{mnemonic: 'eori', match: 0x0a00, mask: 0xff00, fn: Type13},
	{mnemonic: 'cmpi', match: 0x0c00, mask: 0xff00, fn: Type13},
	
	{mnemonic: 'btst', match: 0x0100, mask: 0xf1c0, fn: Type21},
	{mnemonic: 'bchg', match: 0x0140, mask: 0xf1c0, fn: Type21},
	{mnemonic: 'bclr', match: 0x0180, mask: 0xf1c0, fn: Type21},
	{mnemonic: 'bset', match: 0x01c0, mask: 0xf1c0, fn: Type21},
	
	{mnemonic: 'subq', match: 0x5100, mask: 0xf100, fn: Type6},
	{mnemonic: 'suba', match: 0x9000, mask: 0xf0c0, fn: Type3A, tags:['subtract', '-']},
	{mnemonic: 'subx', match: 0x9100, mask: 0xf130, fn: Type14},
	{mnemonic: 'sub',  match: 0x9000, mask: 0xf000, fn: Type3, tags:['subtract', '-']},
	

	{mnemonic: 'unknown', match: 0, mask: 0, fn: Invalid}
]

registry.setArchitecture('m68k', function(options) {
	var arch = new ArchBigEndian()
	arch.decode = function(image, at) {
		return TableMatch(arch, arch.read16(image, at), at, image, insn_table);
	}
	return arch;
})