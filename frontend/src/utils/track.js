export const trackNames = {
    'Ar': 'Arvika',
    'Ax': 'Axevalla',
    'Bo': 'Bodentravet',
    'Bs': 'Bollnäs',
    'B': 'Bergsåker',
    'C': 'Charlottenlund',
    'D': 'Dannero',
    'E': 'Eskilstuna',
    'F': 'Färjestad',
    'G': 'Gävle',
    'H': 'Hagmyren',
    'Ha': 'Hagmyren',
    'Hd': 'Halmstad',
    'Hg': 'Hoting',
    'J': 'Jägersro',
    'Kr': 'Kalmar',
    'Ka': 'Kalmar',
    'Kh': 'Karlshamn',
    'L': 'Lindesberg',
    'Ly': 'Lycksele',
    'Mp': 'Mantorp',
    'Ov': 'Oviken',
    'Ro': 'Romme',
    'Rä': 'Rättvik',
    'Rm': 'Roma',
    'S': 'Solvalla',
    'Sk': 'Skellefteå',
    'Sä': 'Solänget',
    'T': 'Tingsryd',
    'Ti': 'Tingsryd',
    'U': 'Umåker',
    'Vg': 'Vaggeryd',
    'Vi': 'Visby',
    'Å': 'Åby',
    'Ål': 'Åland',
    'Åm': 'Åmål',
    'År': 'Årjäng',
    'Ö': 'Örebro',
    'Ös': 'Östersund'
};

export function getTrackName(code) {
    return trackNames[code] || code;
}

// New: reverse lookup of track code by human-readable name (case-insensitive)
export function getTrackCodeFromName(name) {
    if (!name || typeof name !== 'string') return ''
    const target = name.trim().toLowerCase()
    for (const [code, n] of Object.entries(trackNames)) {
        if (String(n).toLowerCase() === target) return code
    }
    return ''
}
