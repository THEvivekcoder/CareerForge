// Controller for fetching tech & career news from GNews API
// GET: /api/news?category=technology&q=keyword&page=1

const GNEWS_BASE = "https://gnews.io/api/v4";

// Map our UI categories to GNews query strings / category params
const CATEGORY_CONFIG = {
  all:          { endpoint: "search",        q: "technology OR software OR AI OR jobs" },
  ai:           { endpoint: "search",        q: "artificial intelligence OR machine learning OR generative AI" },
  itjobs:       { endpoint: "search",        q: "IT jobs OR tech hiring OR software engineer hiring OR layoffs tech" },
  startups:     { endpoint: "search",        q: "startup funding OR tech startup OR Series A OR venture capital" },
  bigtech:      { endpoint: "search",        q: "Google OR Microsoft OR Apple OR Meta OR Amazon tech" },
  india:        { endpoint: "top-headlines", category: "technology", country: "in" },
  global:       { endpoint: "top-headlines", category: "technology" },
};

export const getNews = async (req, res) => {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "GNEWS_API_KEY is not configured on the server." });
    }

    const category = req.query.category || "all";
    const page = parseInt(req.query.page) || 1;
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.all;

    let url;
    if (config.endpoint === "top-headlines") {
      url = `${GNEWS_BASE}/top-headlines?category=${config.category}&lang=en&max=10&page=${page}&apikey=${apiKey}`;
      if (config.country) url += `&country=${config.country}`;
    } else {
      url = `${GNEWS_BASE}/search?q=${encodeURIComponent(config.q)}&lang=en&max=10&page=${page}&sortby=publishedAt&apikey=${apiKey}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ message: data.errors?.[0] || "Failed to fetch news" });
    }

    return res.status(200).json({
      totalArticles: data.totalArticles,
      articles: data.articles,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
