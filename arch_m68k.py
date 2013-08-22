"""
* Unravel
* Interactive Disassembler
* (c) 2013 Tiago Rezende
*
* Motorola 68k driver
"""

from unravel_base import *

def M68K_Invalid_Insn(op, at, image):
    return Insn('invalid', ['invalid'], at, 2, {}, [])

def M68K_decode_size_A(op):
	size_field = (op & (0x60)) >> 6
	sizes = [
		{id: "b", size:1},
		{id: "w", size:2},
		{id: "l", size:4},
		False
	]
	return sizes[size]

def M68K_decode_addr_mode_A_data_reg(op, at, image):
	reg_field = (op & 7)
	return {mnemonic: 'd'+reg_field, mode: ['direct', 'register', 'data'], extra: 0}

def M68K_decode_addr_mode_A_addr_reg(op, at, image):
	reg_field = (op & 7)
	return {mnemonic: 'a'+reg_field, mode: ['direct', 'register', 'addr'], extra: 0}

def M68K_decode_addr_mode_A_addr(op, at, image):
	reg_field = (op & 7)
	return {mnemonic: '(a'+reg_field+')', mode: ['indirect', 'register', 'addr'], extra: 0}

def M68K_decode_addr_mode_A_addr_postinc(op, at, image):
	reg_field = (op & 7)
	return {mnemonic: '(a'+reg_field+')+', mode: ['indirect', 'register', 'addr', 'postinc'], extra: 0}

def M68K_decode_addr_mode_A_addr_predec(op, at, image):
	reg_field = (op & 7)
	return {mnemonic: '-(a'+reg_field+')', mode: ['indirect', 'register', 'addr', 'predec'], extra: 0}

def M68K_decode_addr_mode_A_addr_index(op, at, image):
	reg_field = (op & 7)
	disp = image.read16(at+2)
	reg2_field = (disp &0xf00)>>8
	scale = 
	disp = disp & 0xff
	if disp >= 0x80:
		disp -= 0x100
	return {mnemonic: '(a'+reg_field+')', mode: ['indirect', 'register', 'addr', 'displacement'], extra: 2}

def M68K_decode_addr_mode_A_addr_disp(op, at, image):
	reg_field = (op & 7)
	disp = image.read16(at+2)
	if disp >= 0x8000:
		disp -= 0x10000
	return {mnemonic: '(a'+reg_field+')', mode: ['indirect', 'register', 'addr', 'displacement'], extra: 2}

def M68K_decode_addr_mode_A_abs_short(op, at, image):
	disp = image.read16(at+2)
	if disp >= 0x8000:
		disp += 0xffff0000
	return {mnemonic: "(0x%x)"%(disp), mode: ['absolute', 'short'], extra: 2}

def M68K_decode_addr_mode_A_abs_long(op, at, image):
	disp = image.read32(at+2)
	return {mnemonic: "(0x%x)"%(disp), mode: ['absolute', 'long'], extra: 2}

def M68K_decode_addr_mode_A_pc_disp(op, at, image):
	disp = image.read16(at+2)
	if disp >= 0x8000:
		disp -= 0x10000
	return {mnemonic: "(0x%x, pc)"%(disp), mode: ['pc', 'relative', 'short', 'displacement'], displacement:disp, extra: 2}





def M68K_decode_addr_mode_A(op):
	mode_field = (op & 0x38) >> 3
	if mode_field is 7:
		return M68K_decode_addr_mode_A_other(op)
	else:
		modes = [
			{type: 'data_reg',     reader: M68K_decode_addr_mode_A_data_reg},
			{type: 'addr_reg',     reader: M68K_decode_addr_mode_A_addr_reg},
			{type: 'addr',         reader: M68K_decode_addr_mode_A_addr},
			{type: 'addr_postinc', reader: M68K_decode_addr_mode_A_addr_postinc},
			{type: 'addr_predec',  reader: M68K_decode_addr_mode_A_addr_predec},
			{type: 'addr_disp',    reader: M68K_decode_addr_mode_A_addr_disp},
			{type: 'addr_index',   reader: M68K_decode_addr_mode_A_addr_index},
		]
		return modes[mode_field]


def M68K_decode_addr_mode_A_other(op):
	mode_field = (op & 7)
	modes = [
		{type: 'abs_short',    reader: M68K_decode_addr_mode_A_abs_short},
		{type: 'abs_long',     reader: M68K_decode_addr_mode_A_abs_long},
		{type: 'pc_disp',      reader: M68K_decode_addr_mode_A_pc_disp},
		{type: 'pc_index',     reader: M68K_decode_addr_mode_A_pc_index},
		{type: 'imm',          reader: M68K_decode_addr_mode_A_imm},
		None,
		None,
		None
	]
	return modes[mode_field]

def M68K_ORI(op, at, image):
	size = M68K_decode_size_A(op)
	if size:
		op_size = 2
		return Insn('ori.'+size['id'], ['logic', 'or'], at, op_size, {})
	else:
		return M68K_Invalid_Insn(op, at, image)

m68k_0xxx_even_tbl = [
        M68K_ORI,
        M68K_ANDI,
        M68K_SUBI,
        M68K_ADDI,
        M68K_BIT_Imm_Insn,
        M68K_EORI,
        M68K_CMPI,
        M68K_Invalid_Insn,
    ]
def M68K_0xxx_Insn(op, at, image):
    index = (op / 65536) & 255
    if index & 1 is 1:
        pass
    else:
        return m68k_0xxx_even_tbl(op, at, image)

m68k_addr_mode = [
    'data_reg',
    'addr_reg',
    'addr',
    'addr_postinc',
    'addr_predec',
    'addr_disp',
    'addr_index',
    'other'
    ]
m68k_addr_other = [
    'abs_short',
    'abs_long',
    'pc_disp',
    'pc_index',
    'imm'
    ]
def M68K_decode_move(op, at, image):
    mode_dest = (op >> 6) & 7
    mode_src = (op >> 3) & 7
    dest_reg = (op >> 9) & 7
    src_reg = op & 7
    
    
def M68K_MOVEB_Insn(op, at, image):
    pass
def M68K_MOVEW_Insn(op, at, image):
    pass
def M68K_MOVEL_Insn(op, at, image):
    pass

condition_codes = [
	{cc: "t",  descr: 'true'},
	{cc: "f",  descr: 'false'},
	{cc: "hi", descr: 'higher'},
	{cc: "ls", descr: 'lower or same'},
	{cc: "cc", descr: 'carry clear'},
	{cc: "cs", descr: 'carry set'},
	{cc: "ne", descr: 'not equal'},
	{cc: "eq", descr: 'equal'},
	{cc: "vc", descr: 'overflow clear'},
	{cc: "vs", descr: 'overflow set'},
	{cc: "pl", descr: 'plus'},
	{cc: "mi", descr: 'minus'},
	{cc: "ge", descr: 'greater or equal'},
	{cc: "lt", descr: 'less than'},
	{cc: "gt", descr: 'greater than'},
	{cc: "le", descr: 'less or equal'}
]
def M68K_Branch_Insn(op, at, image):
	cc = (op & 0x0f00)>>8
	disp = op & 0xff
	size = 2
	if disp >= 0x80:
		disp -= 0x100
	if disp is 0:
		size = 4
		disp = image.read16(at+2)
		if disp >= 0x8000:
			disp -= 0x10000
		disp += 2
	disp += 2
	if cc is 0:
		return Insn('bra', ['unconditional','branch'], at, size, {displacement: disp}, [Arrow("goto", at+disp)])
	else:
		cond = condition_codes[cc]
		return Insn('br'+cond['cc'], ['conditional','branch'], at, size, {displacement: disp, description: "branch if "+cond['descr']}, [Arrow("goto", at+size), Arrow("goto", at+disp)])


def M68K_MOVEP_Insn(op, at, image, data):
	data_reg = (op & 0x0e00) >> 9
	addr_reg = op & 0x07
	direction = op & 0x80
	displacement = 0
	if data['size'] == 4:
		displacement = image.read32(at+2)
	else:
		displacement = image.read16(at+2)
	return Insn(data['mnemonic'].format({source:s}), ['move', 'peripheral'], at, 2+data['size'])

m68k_insn_patterns = [
	{mnemonic: 'abcd', match: 0xc100, mask: 0xf1f0, fn: M68K_Type14_Insn},
	{mnemonic: 'adda', match: 0xd0c0, mask: 0xf0c0, fn: M68K_Type3_Insn},
	{mnemonic: 'addx', match: 0xd100, mask: 0xf130, fn: M68K_Type14_Insn},
	{mnemonic: 'add',  match: 0xd000, mask: 0xf000, fn: M68K_Type3_Insn},	
	{mnemonic: 'cmpm', match: 0xb108, mask: 0xf138, fn: M68K_Type19_Insn},
	{mnemonic: 'eor',  match: 0xb100, mask: 0xf100, fn: M68K_Type3_Insn},
	{mnemonic: 'cmp',  match: 0xb000, mask: 0xf100, fn: M68K_Type3_Insn},

	{mnemonic: 'reset', match: 0x4e70, mask: 0xffff, fn: M68K_Type10_Insn},
	{mnemonic: 'nop',  match: 0x4e71, mask: 0xffff, fn: M68K_Type10_Insn},
	{mnemonic: 'stop', match: 0x4e72, mask: 0xffff, fn: M68K_Type10_Insn},
	{mnemonic: 'rte',  match: 0x4e73, mask: 0xffff, fn: M68K_Type10_Insn},
	{mnemonic: 'rts',  match: 0x4e75, mask: 0xffff, fn: M68K_Type10_Insn},
	{mnemonic: 'rtr',  match: 0x4e77, mask: 0xffff, fn: M68K_Type10_Insn},
	{mnemonic: 'trapv', match: 0x4e76, mask: 0xffff, fn: M68K_Type10_Insn},
	{mnemonic: 'illegal', match: 0x4afc, mask: 0xffff, fn: M68K_Type10_Insn},
	
	{mnemonic: 'swap', match: 0x4840, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'unlk', match: 0x4e58, mask: 0xfff8, fn: M68K_Type9_Insn},
	{mnemonic: 'link', match: 0x4e50, mask: 0xfff8, fn: M68K_Type1_Insn},

	{mnemonic: 'trap', match: 0x4e40, mask: 0xfff0, fn: M68K_Type24_Insn},
	{mnemonic: 'tas',  match: 0x4ac0, mask: 0xffc0, fn: M68K_Type5_Insn},
	{mnemonic: 'jmp',  match: 0x4ec0, mask: 0xffc0, fn: M68K_Type5_Insn},
	{mnemonic: 'jsr',  match: 0x4e80, mask: 0xffc0, fn: M68K_Type5_Insn},

	{mnemonic: 'move {ea}, usp', match: 0x4e60, mask: 0xfff8, fn: M68K_Type28_Insn, direction:'reg'},
	{mnemonic: 'move usp, {ea}', match: 0x4e68, mask: 0xfff8, fn: M68K_Type28_Insn, direction:'mem'},

	{mnemonic: 'move ccr, {ea}', match: 0x42c0, mask: 0xffc0, fn: M68K_Type26_Insn, direction:'mem'},
	{mnemonic: 'move {ea}, ccr', match: 0x44c0, mask: 0xffc0, fn: M68K_Type26_Insn, direction:'reg'},
	{mnemonic: 'move sr, {ea}',  match: 0x40c0, mask: 0xffc0, fn: M68K_Type26_Insn, direction:'mem'},
	{mnemonic: 'move {ea}, sr',  match: 0x46c0, mask: 0xffc0, fn: M68K_Type26_Insn, direction:'reg'},
	
	{mnemonic: 'nbcd', match: 0x4800, mask: 0xffc0, fn: M68K_Type15_Insn},
	{mnemonic: 'pea',  match: 0x4840, mask: 0xffc0, fn: M68K_Type5_Insn},

	{mnemonic: 'ext',  match: 0x4800, mask: 0xfe30, fn: M68K_Type12_Insn},

	{mnemonic: 'movem', match: 0x4880, mask: 0xfb80, fn: M68K_Type23_Insn},
	
	{mnemonic: 'chk',  match: 0x4180, mask: 0xf1c0, fn: M68K_Type16_Insn},
	{mnemonic: 'lea',  match: 0x41c0, mask: 0xf1c0, fn: M68K_Type2_Insn},

	{mnemonic: 'tst',  match: 0x4a00, mask: 0xff00, fn: M68K_Type7_Insn},
	{mnemonic: 'clr',  match: 0x4200, mask: 0xff00, fn: M68K_Type15_Insn},
	{mnemonic: 'neg',  match: 0x4400, mask: 0xff00, fn: M68K_Type15_Insn},
	{mnemonic: 'negx', match: 0x4000, mask: 0xff00, fn: M68K_Type15_Insn},
	{mnemonic: 'not',  match: 0x4600, mask: 0xff00, fn: M68K_Type15_Insn},
	
	{mnemonic: 'dbt',  match: 0x50c8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbf',  match: 0x51c8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbhi', match: 0x52c8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbls', match: 0x53c8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbcc', match: 0x54c8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbcs', match: 0x55c8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbne', match: 0x56c8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbeq', match: 0x57c8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbvc', match: 0x58c8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbvs', match: 0x59c8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbpl', match: 0x5ac8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbmi', match: 0x5bc8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbge', match: 0x5cc8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dblt', match: 0x5dc8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dbgt', match: 0x5ec8, mask: 0xfff8, fn: M68K_Type17_Insn},
	{mnemonic: 'dble', match: 0x5fc8, mask: 0xfff8, fn: M68K_Type17_Insn},
	
	{mnemonic: 'st',   match: 0x50c0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'sf',   match: 0x51c0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'shi',  match: 0x52c0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'sls',  match: 0x53c0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'scc',  match: 0x54c0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'scs',  match: 0x55c0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'sne',  match: 0x56c0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'seq',  match: 0x57c0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'svc',  match: 0x58c0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'svs',  match: 0x59c0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'spl',  match: 0x5ac0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'smi',  match: 0x5bc0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'sge',  match: 0x5cc0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'slt',  match: 0x5dc0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'sgt',  match: 0x5ec0, mask: 0xfff8, fn: M68K_Type5_Insn},
	{mnemonic: 'sle',  match: 0x5fc0, mask: 0xfff8, fn: M68K_Type5_Insn},

	{mnemonic: 'bt',   match: 0x6000, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bf',   match: 0x6100, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bhi',  match: 0x6200, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bls',  match: 0x6300, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bcc',  match: 0x6400, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bcs',  match: 0x6500, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bne',  match: 0x6600, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'beq',  match: 0x6700, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bvc',  match: 0x6800, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bvs',  match: 0x6900, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bpl',  match: 0x6a00, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bmi',  match: 0x6b00, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bge',  match: 0x6c00, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'blt',  match: 0x6d00, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'bgt',  match: 0x6e00, mask: 0xff00, fn: M68K_Type8_Insn},
	{mnemonic: 'ble',  match: 0x6f00, mask: 0xff00, fn: M68K_Type8_Insn},
	

	{mnemonic: 'addq', match: 0x5000, mask: 0xf100, fn: M68K_Type6_Insn},
	{mnemonic: 'muls', match: 0xc1c0, mask: 0xf1c0, fn: M68K_Type16_Insn},
	{mnemonic: 'mulu', match: 0xc0c0, mask: 0xf1c0, fn: M68K_Type16_Insn},
	

	{mnemonic: 'rol',  match: 0xe7c0, mask: 0xffc0, fn: M68K_Type11_Insn},
	{mnemonic: 'roxl', match: 0xe5c0, mask: 0xffc0, fn: M68K_Type11_Insn},
	{mnemonic: 'lsl',  match: 0xe3c0, mask: 0xffc0, fn: M68K_Type11_Insn},
	{mnemonic: 'asl',  match: 0xe100, mask: 0xf118, fn: M68K_Type11_Insn},
	{mnemonic: 'asl',  match: 0xe1c0, mask: 0xf1c0, fn: M68K_Type11_Insn},

	{mnemonic: 'ror',  match: 0xe6c0, mask: 0xffc0, fn: M68K_Type11_Insn},
	{mnemonic: 'roxr', match: 0xe4c0, mask: 0xffc0, fn: M68K_Type11_Insn},
	{mnemonic: 'lsr',  match: 0xe2c0, mask: 0xffc0, fn: M68K_Type11_Insn},
	{mnemonic: 'asr',  match: 0xe000, mask: 0xf118, fn: M68K_Type11_Insn},
	{mnemonic: 'asr',  match: 0xe0c0, mask: 0xf1c0, fn: M68K_Type11_Insn},

	{mnemonic: 'rol',  match: 0xe118, mask: 0xf118, fn: M68K_Type11_Insn},
	{mnemonic: 'ror',  match: 0xe018, mask: 0xf118, fn: M68K_Type11_Insn},
	{mnemonic: 'roxl', match: 0xe110, mask: 0xf118, fn: M68K_Type11_Insn},
	{mnemonic: 'roxr', match: 0xe010, mask: 0xf118, fn: M68K_Type11_Insn},

	{mnemonic: 'move.b', match: 0x1000, mask: 0xf000, fn: M68K_Type4_Insn},
	{mnemonic: 'move.l', match: 0x2000, mask: 0xf000, fn: M68K_Type4_Insn},
	{mnemonic: 'move.w', match: 0x3000, mask: 0xf000, fn: M68K_Type4_Insn},

	{mnemonic: 'moveq', match: 0x7000, mask: 0xf100, fn: M68K_Type22_Insn},

	{mnemonic: 'sbcd', match: 0x8100, mask: 0xf1f0, fn: M68K_Type14_Insn},
	{mnemonic: 'or',   match: 0x8000, mask: 0xf000, fn: M68K_Type3_Insn},

	{mnemonic: 'ori #{value}, ccr', match: 0x003c, mask: 0xffff, fn: M68K_Type27_Insn},
	{mnemonic: 'ori #{value}, sr', match: 0x007c, mask: 0xffff, fn: M68K_Type27_Insn},
	{mnemonic: 'ori #{value}, sr', match: 0x007c, mask: 0xffff, fn: M68K_Type27_Insn},
	{mnemonic: 'eori #{value}, ccr', match: 0x0a3c, mask: 0xffff, fn: M68K_Type27_Insn},
	{mnemonic: 'eori #{value}, sr', match: 0x0a7c, mask: 0xffff, fn: M68K_Type27_Insn},
	{mnemonic: 'andi #{value}, ccr', match: 0x023c, mask: 0xffff, fn: M68K_Type27_Insn},
	{mnemonic: 'andi #{value}, sr', match: 0x027c, mask: 0xffff, fn: M68K_Type27_Insn},

	{mnemonic: 'movep.w {disp}({addr}), {data}', match: 0x0108, mask: 0xf1f8, fn: M68K_MOVEP_Insn, size: 2, direction:'mem'},
	{mnemonic: 'movep.w {data}, {disp}({addr})', match: 0x0188, mask: 0xf1f8, fn: M68K_MOVEP_Insn, size: 2, direction:'reg'},
	{mnemonic: 'movep.l {disp}({addr}), {data}', match: 0x0148, mask: 0xf1f8, fn: M68K_MOVEP_Insn, size: 4, direction:'mem'},
	{mnemonic: 'movep.l {data}, {disp}({addr})', match: 0x01c8, mask: 0xf1f8, fn: M68K_MOVEP_Insn, size: 4, direction:'reg'},
	
	{mnemonic: 'btst', match: 0x0800, mask: 0xffc0, fn: M68K_Type20_Insn},
	{mnemonic: 'bchg', match: 0x0840, mask: 0xffc0, fn: M68K_Type20_Insn},
	{mnemonic: 'bclr', match: 0x0880, mask: 0xffc0, fn: M68K_Type20_Insn},
	{mnemonic: 'bset', match: 0x08c0, mask: 0xffc0, fn: M68K_Type20_Insn},

	{mnemonic: 'ori',  match: 0x0000, mask: 0xff00, fn: M68K_Type13_Insn},
	{mnemonic: 'addi', match: 0x0600, mask: 0xff00, fn: M68K_Type13_Insn},
	{mnemonic: 'andi', match: 0x0200, mask: 0xff00, fn: M68K_Type13_Insn},
	{mnemonic: 'subi', match: 0x0400, mask: 0xff00, fn: M68K_Type13_Insn},
	{mnemonic: 'eori', match: 0x0a00, mask: 0xff00, fn: M68K_Type13_Insn},
	{mnemonic: 'cmpi', match: 0x0c00, mask: 0xff00, fn: M68K_Type13_Insn},
	
	{mnemonic: 'btst', match: 0x0100, mask: 0xf1c0, fn: M68K_Type21_Insn},
	{mnemonic: 'bchg', match: 0x0140, mask: 0xf1c0, fn: M68K_Type21_Insn},
	{mnemonic: 'bclr', match: 0x0180, mask: 0xf1c0, fn: M68K_Type21_Insn},
	{mnemonic: 'bset', match: 0x01c0, mask: 0xf1c0, fn: M68K_Type21_Insn},
	
	{mnemonic: 'subq', match: 0x5100, mask: 0xf100, fn: M68K_Type6_Insn},
	{mnemonic: 'suba', match: 0x9000, mask: 0xf0c0, fn: M68K_Type3_Insn},
	{mnemonic: 'subx', match: 0x9100, mask: 0xf130, fn: M68K_Type14_Insn},
	{mnemonic: 'sub',  match: 0x9000, mask: 0xf000, fn: M68K_Type3_Insn},
	

	{mnemonic: 'unknown', match: 0, mask: 0, fn: M68K_Invalid_Insn}
]

class ArchM68K(ArchBigEndian):
    def decode(self, image, at):
        return TableMatch(self.read16(image, at), at, image)