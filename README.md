Unravel
=======

_An Interactive Disassembler Project in Python_

**Unravel** is a stab at creating an interactive disassembler for various platforms, beginning with the Motorola 68K processor, and hopefully to be extended to other processors and to whole systems. One of the aims of the project is to provide a toolkit for analyzing assembly code as a graph, with references to statically (and potentially dynamically, through user scripting and simulation) reachable code and data, and the ability to mark and explore binary files with such marks. User-specified scripts for data decompression/decryption are also going to be supported.

Wishes/Roadmap
--------------

- System profiles detailing memory regions and coprocessor extensions
- Project files for generating system flow graphs spanning multiple files / architectures
- Ability to recognize patterns generated from common code compilers, and generate higher-level descriptions (nearer to C code) of the analyzed binary sections
- Assemblers for the supported architectures, for binary patching



