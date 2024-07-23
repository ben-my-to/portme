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
    "Assembly Language",
]
---

>I do not support piracy. What I provide in this article is entirely for __educational purposes__ only.

## Intro

<img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/game.png" alt="game">

My first gaming console was the _Nintendo DS_, and one of my nostalgic games, besides _Pokémon_, was [_Spectrobes - Beyond the Portal_](https://spectrobes.fandom.com/wiki/Spectrobes_Beyond_the_Portals).
The game features mechanics similar to _Pokémon_, with a collection of spectrobes. What differentiates them is their combat system. _Pokémon_ is turn-based, while _Spectrobes - Beyond the Portal_ is third-person.

As with _Pokémon_, spectrobes level up through experience points (XP) through battling; however, most of their XP's come from _minerals_. Spectrobes gain more XP if fed minerals of their type and larger size. Anyone who has played this game knows the struggle of farming/grinding minerals (especially during the swamp area).

On a physical console, you would need to use a stylus to 'erase' the debris from the mineral by pressing on the bottom screen. Each mineral type has specific threshold pressure points, and if you exceed them, the mineral's health will 'visually' decrease by one. The amount of XP gained from a mineral depends on the _time taken_, the _percentage recovered_, and the _mineral's health_. You either learn to maintain short/long pressure points or cheese it by one-tap spamming to guarantee no damage. Either way, at some point, the gameplay becomes tedious and unenjoyable.

## Plan

My goal is to permanently prevent mineral health (HP) from ever decreasing. As a result, you can rapidly scribble across the screen without destroying the mineral at all! Most games design "damage taken" in _decreasing_ order, as it is logical. A player starts with 10 HP, gets hit, and ends up with 9 HP. From the image above, my first attempt was to scan for the value 16 and work my way down. It did not work. I knew it had to be an `int` data type. Then I realized, what if those sneaky developers keep a running count instead? As such, I scanned in _increasing_ order, and it worked.

Nonetheless, somewhere, there is a _conditional_ branch that checks whether you have exceeded the threshold pressure point. We basically need to change it to an _unconditional_ branch. Simple enough, right?

```text
if False:
    mineral.health += 1

if mineral.health == 16:
    print("YOU DIED")
```

## Prerequisites

- A __legitimate__ `.nds` rom for _Spectrobes - Beyond the Portal_
- Desmume [[Source](https://github.com/TASEmulators/desmume/releases/tag/release_0_9_13), [Manual](https://wiki.desmume.org/index.php?title=Installing_DeSmuME_from_source_on_Linux)]
- [PINCE](https://github.com/korcankaraokcu/PINCE)
- [GNU ARM Embedded Toolchain](https://developer.arm.com/downloads/-/gnu-rm)
- [Ghidra](https://github.com/NationalSecurityAgency/ghidra/releases/latest)
- [NTRGhidra](https://github.com/pedro-javierf/NTRGhidra/releases/latest)

This article also assumes you know basic Linux commands (`cd`, `ls`, `echo`, etc.) and assembly.

## Memory and Overlay Scanning

>__NOTE__: You would need to use a tool like `ndstool` to unpack the `.nds` file before proceeding.

Overlays are loaded during run-time when needed. Information about overlays, including base address, size, etc., is stored in the `y9.bin` file. Different overlays may overlap the same memory regions, but never at the same time. For a game like _Pokémon_, there could be 400+ overlays. Luckily, _Spectrobes - Beyond the Portal_ has only 56 overlays. For our purposes, we need only find which overlay holds the functionality for manipulating the mineral's HP.

To find the correct loaded overlay, we first need to find the _static_ memory address for the mineral's HP. Then, check if an overlay's base address is less than what you found. Lastly, go to the memory address and verify the bytes match.

<img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/memscan.png" alt="memscan">

Since Desmume's RAM search and memory viewer only works on Windows, I have used the tool _PINCE_ to find the mineral's HP memory address. I found that the mineral's HP address `0x2000000 + 0x2310f0 = 0x22310f0` resides in `overlay_0051.bin`. The command below finds the base address of overlay 51, which turns out to be `0209ebc0` (in little-endian format).

```text
$ hexdump -C y9.bin | grep -m 1 '33 00 00 00'
00000660  33 00 00 00 c0 eb 09 02  00 9d 01 00 40 5c 00 00  |3...........@\..|
```

## Debugging and Decompiling using Ghidra

<img src="https://raw.githubusercontent.com/ben-my-to/website/main/static/images/test.png" alt="test">

```text
desmume path/to/spectrobes.nds --arm9gdb 3000
arm-none-eabi-gdb -ex "set arch armv5t" -ex "target remote :3000"
```

1. Setup NTRGhidra Plugin
    - `wget -P "path/to/ghidra/extensions" "https://github.com/pedro-javierf/NTRGhidra/releases/download/v1.4.4.1-ghidra-11.0.3/ghidra_11.0.3_PUBLIC_20240411_NTRGhidra.zip"`

2. Create a New Project
    - File > New Project (Ctrl+n) > Non-Shared Project > Choose Project Directory and Name
    - File > Install Extensions > NTRGhidra
    - File > Import File (I) > _path/to/rom.nds_ > Choose 'ARM9' > Select 'YES' for a commercial game
    - You see in the 'Program Tree' window that the plugin has automatically extracted the `arm9.bin`, `overlay_{0-55}.bin`, and other binaries.

3. Analyze the Binaries
    - Analyze > Auto Analyze (A) > Analyze
    - This could take several minutes, so please be patient.

4. Search for Desired Instruction
    - Go To... (G) > `020A0CCB`
    - We end up at the branch instruction: `ble LAB_overlay_51__020a0ce8`
    - Observe the instructions below the branch instruction
        - `ldr r1,[r10,#0x14]`
        - `add r1,r1,#0x1`
    - Clearly, the mineral's HP is located at address `[r10+#0x14]=>DAT_22301f0` and it is being incremented by 1 if the branch condition is false.

5. Analysis _(Optional)_
    - Following the branch, you will see two other interesting instructions
        - `cmp r0,#0x10`
        - `movgt r0,#0x10`
    - Try to trace back from the current label (prefixed with `LAB_`) of those two instructions.
    - What instruction called that label?
    - How does this relate to our previous observation?

6. Make an Action Replay Code

```txt
220A0CCB 000000EA  ; Change mneumonic `ble` -> 'b'
```

The first address indicates the memory address to modify. Additionally, the highest-bit `2` means to modify only the first byte. The second address is the value to modify. So at address `020A0CCB`, change the first byte to `EA`. If you want to revert this, change `EA` to `DA`.

```txt
220A0CCB 000000DA  ; Change mneumonic `b` -> 'ble'
```

## Credits

- [Reverse Engineering a DS Game](https://www.starcubelabs.com/reverse-engineering-ds/)
- [Using GDB with Ghidra and melonDS](https://bookstack.nsmbcentral.net/books/new-super-mario-bros-ds/page/using-gdb-with-ghidra-and-melonds)
