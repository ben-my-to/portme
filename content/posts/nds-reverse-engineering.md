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

>I do not support piracy. What I provide in this article is entirely for __educational purposes__ only.

My first gaming console was the _Nintendo DS_, and one of my memorable games, besides _Pokémon_, was [_Spectrobes - Beyond the Portal_](https://spectrobes.fandom.com/wiki/Spectrobes_Beyond_the_Portals).
The game features similar game mechanics to _Pokémon_, with a collection of spectrobes. What differentiates them is their combat system. _Pokémon_ is turn-based while _Spectrobes - Beyond the Portal_ is third-person.

As with _Pokémon_, spectrobes level up through experience points (XP) through battling; however, most of their XP's come from _minerals_. Spectrobes gain more XP if fed minerals of their type and larger size. Anyone who has played this game before knows the struggle of farming/grinding _minerals_ (especially during the swamp area).

## Requirements (If you want to follow along)

- A __legitimate__ `.nds` rom for _Spectrobes - Beyond the Portal_
- Desmume [[Source](https://github.com/TASEmulators/desmume/releases/tag/release_0_9_13), [Manual](https://wiki.desmume.org/index.php?title=Installing_DeSmuME_from_source_on_Linux)]
- [PINCE](https://github.com/korcankaraokcu/PINCE)
- [Ghidra](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_11.1.2_build)
- [GNU ARM Embedded Toolchain](https://developer.arm.com/downloads/-/gnu-rm)

```bash
desmume spectrobes.nds --arm9gdb 3000 --load-slot 1
arm-none-eabi-gdb -ex "set arch armv5t" -ex "target remote :3000"
```

## Memory and Overlay Scanning

<img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/memscan.png" alt="memscan">

## Debugging and Decompiling using Ghidra

<img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/test.png" alt="test">

1. Create a New Project
    - File > New Project > Non-Shared Project > spectrobes-mods
    - File > Import File > _path/to/arm9.bin_
    - Language: `ARM:LE:v5t:default`
    - Options > Base Address: `02000000`

2. Add `overlay_0051.bin` file to the program
    - File > Add to Program > _path/to/overlay_0051.bin_
    - Block Name: `overlay_0051.bin`
    - Options > Base Address: `0209ebc0` (shown in little endian)
    - __NOTE__: `hexdump -C y9.bin | grep -m 1 '33 00 00 00'`

3. Search for Desired Instruction
    - Press 'g' > `020A0CCB`
    - We end up at the instruction: `ble LAB_020a0ce8`
    - Following the branch, we see two other interesting instructions:

    ```txt
    cmp r0,#0x10
    movgt r0,#0x10
    ```

## Credits

- [Reverse Engineering a DS Game](https://www.starcubelabs.com/reverse-engineering-ds/)
- [Using GDB with Ghidra and melonDS](https://bookstack.nsmbcentral.net/books/new-super-mario-bros-ds/page/using-gdb-with-ghidra-and-melonds)