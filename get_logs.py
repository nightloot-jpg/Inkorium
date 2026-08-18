import requests
try:
    print(requests.get("http://localhost:5173").text[:500])
except Exception as e:
    print(e)
