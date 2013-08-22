"""
* Unravel
* Interactive Disassembler
* (c) 2013 Tiago Rezende
*
* Base types, classes and algorithms
"""


class CodeGraphNode:
    def __init__(self, at, read_as="code"):
        self.at = at
        self.read_as = read_as
    def trace(self, code, deep = False):
        operation = code.decode(at)
        self.op = operation
        self.flow_goto = []
        self.flow_call = []
        self.flow_data = []
        for arrow in operation.arrows:
            if arrow.type is "goto":
                self.flow_goto += [code.node_at(arrow.dest, deep),]
            elif arrow.type is "call":
                self.flow_call += [code.node_at(arrow.dest, deep),]
            elif arrow.type is "data":
                flow = code.node_at(arrow.dest, False)
                flow.set_read_as(arrow.read_as)
                self.flow_data += [flow,]

class Arrow:
    def __init__(self, type_, dest, read_as=None):
        self.type = type_
        self.dest = dest
        self.read_as = read_as

class Insn:
    def __init__(self, mnemo, tags, at, size, info, arrows):
        self.size = size
        self.mnemonic = mnemo
        self.tags = tags
        self.info = info
        if self.arrows:
            self.arrows = arrows
        else:
            self.arrows = [Arrow('goto', at+size)]

class InsnDecoder:
    def __init__(self, image, arch, entry_addresses):
        self.image = image
        self.entry_addresses = entry_addresses
        self.arch = arch
        self.entry_nodes = {}
        self.traced_nodes = {}
    def make_flow_graph(self):
        for point in self.starting_points:
            node = CodeGraphNode(point)
            self.entry_nodes[point] = node
            node.trace(self, True)
    def decode(self, at):
        return self.arch.decode(image, at)
    def node_at(self, at, follow = False):
        if at in self.traced_nodes:
            return self.traced_nodes[at]
        else:
            node = CodeGraphNode(at)
            if follow:
                self.traced_nodes[at] = node
                node.trace(self, True)
            return node

class ArchBigEndian:
    def read8(self, image, at):
        return image.read_byte(at)
    def read16(self, image, at):
        return self.read8(at)*256 + self.read8(at+1)
    def read32(self, image, at):
        return self.read16(at)*65536 + self.read16(at+2)
    def decode(self, image, at):
        return Insn('halt', None, [])

class ArchLittleEndian:
    def read8(self, image, at):
        return image.read_byte(at)
    def read16(self, image, at):
        return self.read8(at) + self.read8(at+1)*256
    def read32(self, image, at):
        return self.read16(at) + self.read16(at+2)*65536
    def decode(self, image, at):
        return Insn('halt', None, [])

def TableMatch(op, at, image, table):
    for row in table:
        if (op & row['mask']) == row['match']:
            return row['fn'](op, at, image, row)