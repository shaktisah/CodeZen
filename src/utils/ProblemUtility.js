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

/**
 * Submits multiple code execution tasks to OneCompiler in parallel.
 * @param {Array} submissions - Array of submissions. 
 * Each submission looks like: { language, stdin, files }
 */
const submitBatch = async (submissions) => {
    try {
        const requests = submissions.map((sub) => {
            // OneCompiler endpoint on RapidAPI
            return axios.post(
                'https://onecompiler-apis.p.rapidapi.com/api/v1/run',
                {
                    language: sub.language,
                    stdin: sub.stdin,
                    files: sub.files
                },
                {
                    headers: {
                        'content-type': 'application/json',
                        'x-rapidapi-key': process.env.RAPIDAPI_KEY,      // Read from your .env
                        'x-rapidapi-host': process.env.RAPIDAPI_HOST || 'onecompiler-apis.p.rapidapi.com'
                    }
                }
            );
        });

        // Execute all requests concurrently
        const responses = await Promise.all(requests);

        // Return the data array from OneCompiler
        return responses.map(res => res.data);

    } catch (error) {
        console.error("Error executing batch in OneCompiler:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to execute batch code submission");
    }
};
const waiting=async (timer)=>{
    setTimeout(()=>{
return 1;
    },timer)
}

const submitToken=async(resultToken);
for(const test of testResult){
    if(test.status_id!=3){
        res.status(400).send("Error Occured");
    }
}



while(true){
const result=await fetchData();

const IsResultObtain = result.submissions.every((r)=>r.status_id>2);

if(IsResultObtain)
return result.submissions;


 await waiting(1000);


}

module.exports = { getLanguageById, submitBatch, submitToken };