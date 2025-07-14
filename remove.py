import requests

url = "nonehere"

data = {
    "company_id": 1,
    "title": "Sustainable Farming Techniques",
    "description": "This course will teach you modern and sustainable farming practices to improve crop yield and soil health.",
    "skills": ["Organic Farming", "Soil Health", "Crop Rotation"],
    "duration": "40 hours",
    "language": "English",
    "certification": True,
    "max_seats": 69,
    "start_date": "2025-05-09",
    "status": "active",
    "content_url": "https://example.com/sustainable-farming.pdf",
    "created_at": "2025-05-04T12:58:54.914Z",
    "updated_at": "2025-05-04T12:58:54.914Z"
}

response = requests.put(url, json=data)
print("Status code:", response.status_code)
print("Response:", response.json())