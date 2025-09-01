const ratingService = require('../services/ratingService');
const logger = require('../utils/logger');
const config = require('../config');
const { getEmojiForSource } = require('../utils/emojiMapper');

// These are the new tools we need for your scraper
const fetch = require('node-fetch');
const cheerio = require('cheerio');

// I've updated this function to accept and display the new Parental Guide text
function formatRatingsCard(ratings, guideText) {
    const lines = ["───────────────"];

    // Common Sense (child-safety first)
    const commonSense = ratings.find(r => r.source === 'Common Sense');
    if (commonSense) {
        lines.push(`${getEmojiForSource(commonSense.source)} ${commonSense.value}`);
    }

    // Standard ratings
    ratings
        .filter(r => ['IMDb', 'TMDb', 'MC', 'MC Users', 'RT', 'RT Users'].includes(r.source))
        .sort((a, b) => {
            const order = ['IMDb', 'TMDb', 'MC', 'MC Users', 'RT', 'RT Users'];
            return order.indexOf(a.source) - order.indexOf(b.source);
        })
        .forEach(rating => {
            lines.push(`${getEmojiForSource(rating.source)} ${rating.source.padEnd(9)}: ${rating.value}`);
        });

    // CringeMDB + Certification
    const cringe = ratings.find(r => r.source === 'CringeMDB' || r.source === 'Certification');
    if (cringe) {
        cringe.value.split('\n').forEach(line => {
            if (line.trim()) lines.push(line.trim());
        });
    }

    // --- Start of Your New Code ---
    // This new section adds the Parental Guide if it was found
    if (guideText) {
        lines.push("───────────────");
        lines.push(`ℹ️  Parents Guide`);
        lines.push(guideText);
    }
    // --- End of Your New Code ---

    lines.push("───────────────");
    return lines.join('\n');
}

async function streamHandler({ type, id }) {
    logger.info(`Received stream request for: type=${type}, id=${id}`);

    if (!id || !id.startsWith('tt')) {
        logger.warn(`Invalid or unsupported ID format: ${id}`);
        return { streams: [] };
    }

    try {
        // First, it gets the original ratings
        const ratings = await ratingService.getRatings(type, id);

        // --- Start of Your Scraper Logic ---
        let parentalGuideText = null; // We'll store the guide here
        try {
            const url = `https://www.imdb.com/title/${id}/parentalguide`;
            const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36" };
            const response = await fetch(url, { headers: headers });
            const html = await response.text();
            const $ = cheerio.load(html);

            const sections = {};
            $("li[data-testid='rating-item']").each((_, el) => {
                const label = $(el).find("a.ipc-metadata-list-item__label").text().trim().replace(":", "");
                const severity = $(el).find("div.ipc-html-content-inner-div").text().trim();
                if (label && severity && severity !== "None") {
                    const shortLabel = label.replace(" & Gore", "").replace(" & Nudity", "").replace(", Drugs & Smoking", "");
                    sections[shortLabel] = severity;
                }
            });
            
            const realGuideText = Object.entries(sections)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" | ");

            if (realGuideText) {
                parentalGuideText = realGuideText;
            }
        } catch (err) {
            logger.error(`Failed to scrape Parental Guide for ${id}: ${err.message}`);
        }
        // --- End of Your Scraper Logic ---

        if (!ratings?.length && !parentalGuideText) {
            logger.info(`No ratings or guide found for: ${id}`);
            return { streams: [] };
        }

        const stream = {
            name: "🎯 Ratings Aggregator",
            // We now pass both the ratings and your new guide text to be formatted
            description: formatRatingsCard(ratings || [], parentalGuideText),
            externalUrl: `${config.sources.imdbBaseUrl}/title/${id.split(':')[0]}/`,
            behaviorHints: {
                notWebReady: true,
            },
        };

        logger.info(`Returning 1 rating stream for ${id}`);
        return { streams: [stream] };

    } catch (error) {
        logger.error(`Error in streamHandler for ${id}: ${error.message}`, error);
        return { streams: [] };
    }
}

module.exports = streamHandler;
                                                              
