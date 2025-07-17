// constants.js
export const RATING_SOURCES = [
    { id: 'age', label: '👶 14+', source: 'commonSense' },
    { id: 'imdb', label: '⭐ IMDb     : 6.8/10', source: 'imdb' },
    { id: 'tmdb', label: '🎥 TMDb     : 6.8/10', source: 'tmdb' },
    { id: 'metacritic', label: 'Ⓜ️ MC       : 70/100', source: 'metacritic' },
    { id: 'mcUsers', label: '👤 MC Users : 6.4/10', source: 'mcUsers' },
    {
        id: 'cringemdb',
        label: [
            '⚠️ Not Parent Safe',
            '🔞 Sex Scene',
            '👁️‍🗨️ Nudity'
        ],
        source: 'cringemdb'
    }
];
