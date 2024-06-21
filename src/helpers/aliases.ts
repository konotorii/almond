const aliases = [
    {
        name: "darwin",
        types: ['mac', 'macos', 'osx']
    },
    {
        name: "exe",
        types: ['win32', 'windows', 'win'],
    },
    {
        name: "deb",
        types: ['debian'],
    },
    {
        name: "rpm",
        types: ['fedora'],
    },
    {
        name: "AppImage",
        types: ['appimage'],
    },
    {
        name: "dmg",
        types: ['dmg'],
    },
]

for (const existingPlatform in aliases) {
    const newPlatform = existingPlatform + '_arm64';
    aliases.push({
        name: newPlatform,
        types: aliases[existingPlatform].types.map((alias: string) => `${alias}_arm64`)
    });
}

export default function checkAlias(platform: string) {
    const find = aliases.find((v) => v.name == platform)

    if (typeof find !== 'undefined') {
        return platform
    }

    for (const guess in aliases) {
        const list = aliases[guess]

        if (list.types.includes(platform)) {
            return aliases[guess].name
        }
    }

    return ""
}