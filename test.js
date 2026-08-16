const axios = require("axios");

async function test() {
  try {
    const response = await axios.get("https://en.wikipedia.org/w/api.php", {
      timeout: 10000,

      headers: {
        "User-Agent": "MyNodeApp/1.0 (kamaujoe708@gmail.com)",
      },

      params: {
        action: "query",
        list: "search",
        srsearch: "JavaScript",
        format: "json",
        srlimit: 1,
      },
    });

    console.log(response.data);
  } catch (error) {
    console.error("ERROR:", error.message);
    console.error("CODE:", error.code);
    console.error("STATUS:", error.response?.status);
    console.error("DATA:", error.response?.data);
  }
}

test();
