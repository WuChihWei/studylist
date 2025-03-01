#!/bin/bash

# Variable definitions
USER_ID="aot39WjGKBW3ZhnnwPtZZmfXBfi2"
TOPIC_ID="67a4c31ded27b56fc01cb08e"
MATERIAL_ID="67b30666958e92ab6d1623b6"
API_URL="https://studylistserver-production.up.railway.app"

# Get token
echo "Enter your Firebase ID token:"
read TOKEN

# Test regular GET endpoint 
echo "Testing GET user endpoint..."
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/api/users/$USER_ID" | head -20

# Test debug delete endpoint
echo -e "\n\nTesting debug delete endpoint..."
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/api/delete-material-debug/$USER_ID/$TOPIC_ID/$MATERIAL_ID"

echo -e "\nTest complete!"
