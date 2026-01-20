#!/bin/bash
# Generate remaining deep_dive content using DeepSeek Reasoner
# Usage: bash generate-remaining.sh

API_KEY="sk-9071dfaab4224a4eb8f5517df25a1610"
API_URL="https://api.deepseek.com/chat/completions"

# Terms to generate (excluding already generated ones)
TERMS=(
    "chiron:凯龙星"
    "lilith:莉莉丝"
    "ascendant:上升点"
    "midheaven:中天"
    "north-node:北交点"
    "south-node:南交点"
    "aries:白羊座"
    "taurus:金牛座"
    "gemini:双子座"
    "cancer:巨蟹座"
    "leo:狮子座"
    "virgo:处女座"
    "libra:天秤座"
    "sagittarius:射手座"
    "aquarius:水瓶座"
    "pisces:双鱼座"
    "conjunction:合相"
    "opposition:对分相"
    "square:四分相"
    "trine:三分相"
    "sextile:六分相"
    "air-element:风元素"
    "water-element:水元素"
    "fire-element:火元素"
    "earth-element:土元素"
    "cardinal-mode:基本模式"
    "fixed-mode:固定模式"
    "mutable-mode:变动模式"
    "house-1:第一宫"
    "house-2:第二宫"
    "house-3:第三宫"
    "house-4:第四宫"
    "house-5:第五宫"
    "house-6:第六宫"
    "house-7:第七宫"
    "house-8:第八宫"
    "house-9:第九宫"
    "house-10:第十宫"
    "house-11:第十一宫"
    "house-12:第十二宫"
    "natal-chart:本命盘"
    "synastry-chart:比较盘"
    "composite-chart:组合盘"
    "transit-chart:行运盘"
)

OUTPUT_FILE="/tmp/deepdive_remaining.json"
> "$OUTPUT_FILE"

count=0
for item in "${TERMS[@]}"; do
    IFS=':' read -r term cn <<< "$item"
    ((count++))
    echo "[$count/${#TERMS[@]}] Generating $term..."
    
    response=$(curl -s --max-time 200 "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "{\"model\":\"deepseek-reasoner\",\"messages\":[{\"role\":\"system\",\"content\":\"占星荣格专家。输出纯JSON数组5步deep_dive。\"},{\"role\":\"user\",\"content\":\"${term}(${cn})荣格5步\"}],\"max_tokens\":2500}")
    
    echo "\"$term\": $response" >> "$OUTPUT_FILE"
    sleep 1.5
done

echo "Done! Saved to $OUTPUT_FILE"
echo "Total generated: $count"
