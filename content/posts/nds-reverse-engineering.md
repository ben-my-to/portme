---
author: "Jason Duong"
title: "Nintendo DS Reverse Engineering"
date: "2024-07-20"
description: "A Basic Game Modding Tutorial for 'Spectrobes - Beyond the Portal'"
tags: [
    "Linux",
    "Ghidra",
    "GNU Debugger",
]
categories: [
    "Reverse Enginnering",
    "Assembly",
]
---

>I do not support piracy. What I provide in this article is entirely for __educational purposes__ only.

## Intro

My first gaming console was the _Nintendo DS_, and one of my nostalgic games, besides _Pokémon_, was [_Spectrobes - Beyond the Portal_](https://spectrobes.fandom.com/wiki/Spectrobes_Beyond_the_Portals).
The game features similar mechanics to _Pokémon_, with a collection of spectrobes. What differentiates them is their combat system. _Pokémon_ is turn-based, while _Spectrobes - Beyond the Portal_ is third-person.

As with _Pokémon_, spectrobes level up through experience points (XP) through battling; however, most of their XP's come from _minerals_. Spectrobes gain more XP if fed minerals of their type and larger size. Anyone who has played this game before knows the struggle of farming/grinding _minerals_ (especially during the swamp area).

On a physical console, you would need to use a stylus to 'erase' the debris from the mineral by pressing on the bottom screen. Each mineral type has specific threshold points, and if you exceed them, the mineral health will visually decrease by one. You can recover the mineral if it is above 70%. The amount of XP gained from a mineral depends on the _time taken_, the _percentage recovered_, and the _mineral health_. It is either you learn to maintain short/long threshold points or cheese it by one-tap spamming to guarantee perfect health. Either way, at some point, the gameplay becomes tedious and unenjoyable.

## Plan

My goal is to permanently disable `mineral_health` so that it never decreases. Most games design "damage taken" in _decreasing_ order, as it is logical. A player starts with 10 HP, gets hit, and ends up with 9 HP. My first attempt was to scan for the value 16 and work my way down. It did not work. I knew it had to be an `int` data type. Then I realized, what if those sneaky developers keep a running count instead? As such, I scanned in _increasing_ order, and it worked.

Nonetheless, somewhere, there is a _conditional_ branch that checks whether mineral_health equals 16. We basically need to change it to an _unconditional_ branch. Simple enough, right?

```python
if False:  # replaced from `mineral.is_damaged() -> False`
    mineral.health += 1

if mineral.health == 16:
    print("YOU DIED")
```

## Prerequisites

- A __legitimate__ `.nds` rom for _Spectrobes - Beyond the Portal_
- Desmume [[Source](https://github.com/TASEmulators/desmume/releases/tag/release_0_9_13), [Manual](https://wiki.desmume.org/index.php?title=Installing_DeSmuME_from_source_on_Linux)]
- [PINCE](https://github.com/korcankaraokcu/PINCE)
- [Ghidra](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_11.1.2_build)
- [GNU ARM Embedded Toolchain](https://developer.arm.com/downloads/-/gnu-rm)

This article assumes you know basic linux commands (`cd`, `ls`, `echo`, etc.) and assembly.

## Memory and Overlay Scanning

<img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/memscan.png" alt="memscan">

## Debugging and Decompiling using Ghidra

<img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/test.png" alt="test">

```bash
desmume path/to/spectrobes.nds --arm9gdb 3000
arm-none-eabi-gdb -ex "set arch armv5t" -ex "target remote :3000"
```

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