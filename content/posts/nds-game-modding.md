---
author: "Jason Duong"
title: "Nintendo DS Reverse Engineering: Spectrobes - Beyond the Portal"
date: "2024-07-20"
description: "A Basic Game Modding Tutorial for 'Spectrobes - Beyond the Portal'"
tags: [
    "Ghidra",
    "melonDS",
]
categories: [
    "Reverse Enginnering",
    "Assembly",
]
---

> I do not condone to piracy. What I provide in this article is entirely for __educational_purposes__ only.

## Requirements

- An `.nds` rom for _Spectrobes - Beyond the Portal_
- [Desmume](https://github.com/TASEmulators/desmume/releases/tag/release_0_9_13)
- [Ghidra](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_11.1.2_build)
- [GNU ARM Embedded Toolchain](https://developer.arm.com/downloads/-/gnu-rm)

```bash
desmume spectrobes.nds --arm9gdb 3000 --load-slot 1
arm-none-eabi-gdb -ex "set arch armv5t' -ex "target remote :3000"
(gdb) x/8i 0x020a0cc8
```

<img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/test.png" alt="test">

## Steps

1. Create a New Project
    - File > New Project > Non-Shared Project > spectrobes-mods
    - File > Import File > _path/to/arm9.bin_
    - Language: ARM:LE:v5t:default
    - Options > Base Address: `02000000`

2. Add `overlay_0051.bin` file to the program
    - File > Add to Program > _path/to/overlay_0051.bin_
    - Block Name: `overlay_0051.bin`
    - Options > Base Address: `0209ebc0` (shown in little endian)
    - __NOTE__: `hexdump -C y9.bin | grep -m 1 '33 00 00 00'`

3. Search for Desired Instruction
    - Press 'g' > `020A0CCB`
    - We end up at the instruction: `ble LAB_020a0ce8`
    - Following the branch, we see two other useful instructions:

    ```txt
    cmp r0,#0x10
    movgt r0,#0x10
    ```

## Credits

[Reverse Engineering a DS Game](https://www.starcubelabs.com/reverse-engineering-ds/)
[Using GDB with Ghidra and melonDS](https://bookstack.nsmbcentral.net/books/new-super-mario-bros-ds/page/using-gdb-with-ghidra-and-melonds)