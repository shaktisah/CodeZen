const axios = require('axios');

const getLanguageById = (lang) => {
    const language = {
        "c++": "cpp",
        "java": "java",
        "javascript": "javascript",
        "python": "python"
    };

    return language[lang.toLowerCase()] || lang;
};

const submitBatch = async (submissions) => {
    try {
        const results = [];
        for (const sub of submissions) {
            const response = await axios.post(
                'https://onecompiler-apis.p.rapidapi.com/api/v1/run',
                {
                    language: sub.language,
                    stdin: sub.stdin,
                    files: sub.files
                },
                {
                    headers: {
                        'content-type': 'application/json',
                        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                        'x-rapidapi-host': process.env.RAPIDAPI_HOST || 'onecompiler-apis.p.rapidapi.com'
                    }
                }
            );
            results.push(response.data);
            
            // Wait 1.1 seconds between requests to avoid RapidAPI rate limits (1 req/sec)
            await new Promise(resolve => setTimeout(resolve, 1100));
        }
        return results;
    } catch (error) {
        console.error("Error executing batch in OneCompiler:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to execute batch code submission");
    }
};

module.exports = { getLanguageById, submitBatch };
