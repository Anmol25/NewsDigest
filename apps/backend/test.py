from src.ai.article_loader import ArticleLoader


articles_list = [
    {
        "title": "Israel-Iran War: Tehran's BIG statement on role of India in 12-day conflict, embassy says...",
        "link": "https://www.dnaindia.com/india/report-israel-iran-war-tehran-s-big-statement-on-role-of-india-in-12-day-conflict-embassy-says-3163371",
        "date": "2025-06-25T13:59:00+00:00",
        "source": "DNA India"
    },
    {
        "title": "Iran-Israel War: After bombing Iranian nuclear sites, Donald Trump makes BIG statement on 'nuclear talks' with Tehran, meeting to be held on...",
        "link": "https://www.dnaindia.com/world/report-iran-israel-war-after-bombing-iranian-nuclear-sites-donald-trump-makes-big-statement-on-nuclear-talks-with-tehran-meeting-to-be-held-next-week-3163459",
        "date": "2025-06-26T06:23:00+00:00",
        "source": "DNA India"
    },
    {
        "title": "Who won the Israel-Iran war? What did US gain?",
        "link": "https://www.firstpost.com/explainers/israel-iran-ceasefire-12-day-war-us-role-winners-losers-13900268.html",
        "date": "2025-06-25T04:49:56+00:00",
        "source": "Firstpost"
    },
    {
        "title": "Israel Thanks US' CIA For Help In \"Joint\" Operation Against Iran War",
        "link": "https://www.ndtv.com/world-news/israel-thanks-us-cia-for-help-in-joint-operation-against-iran-war-8762091",
        "date": "2025-06-25T19:19:26+00:00",
        "source": "NDTV"
    },
    {
        "title": "In US, Iranian diaspora contends with Israel-Iran war, fragile ceasefire",
        "link": "https://www.news18.com/agency-feeds/in-us-iranian-diaspora-contends-with-israel-iran-war-fragile-ceasefire-9404082.html",
        "date": "2025-06-25T13:00:04+00:00",
        "source": "News18"
    }
]

loader = ArticleLoader(articles_list)
print(loader)

docs = loader.load()
print(docs)
