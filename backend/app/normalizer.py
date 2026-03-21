from sentence_transformers import SentenceTransformer, util
import uuid

model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    return model

import re
def clean_title_for_embedding(title):
    t = title.lower()
    t = re.sub(r'\b(xl|xxl|sm|md|lg|kg|gm|ml|ltr|gb|tb|cm|mm|inch|xs)\b', '', t)
    t = re.sub(r'\(.*?\)', '', t)
    t = re.sub(r'\[.*?\]', '', t)
    t = re.sub(r'[^a-z0-9\s]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def normalize_results(results, query=""):
    model = get_model()
    if not results:
        return []
        
    if query:
        query_words = set(query.lower().split())
        filtered = []
        for res in results:
            title_lower = res['title'].lower()
            if any(word in title_lower for word in query_words):
                filtered.append(res)
        results = filtered

    if not results:
        return []
    
    titles_to_embed = [clean_title_for_embedding(res['title']) for res in results]
    embeddings = model.encode(titles_to_embed, convert_to_tensor=True)
    
    assigned_groups = {}
    
    for i in range(len(results)):
        if i in assigned_groups:
            continue
        group_id = str(uuid.uuid4())
        assigned_groups[i] = group_id
        results[i]['group_id'] = group_id
        
        for j in range(i + 1, len(results)):
            if j not in assigned_groups:
                sim = util.cos_sim(embeddings[i], embeddings[j]).item()
                if sim > 0.65:
                    assigned_groups[j] = group_id
                    results[j]['group_id'] = group_id

    # Mark absolute lowest price
    for res in results:
        res['is_lowest_price'] = False
        
    if results:
        valid_items = [res for res in results if res['price'] > 0]
        if valid_items:
            min_item = min(valid_items, key=lambda x: x['price'])
            min_item['is_lowest_price'] = True
            
    return results
