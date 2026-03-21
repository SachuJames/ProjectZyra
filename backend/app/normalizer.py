from sentence_transformers import SentenceTransformer, util
import uuid

model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    return model

def normalize_results(results):
    model = get_model()
    if not results:
        return []
    
    titles = [res['title'] for res in results]
    embeddings = model.encode(titles, convert_to_tensor=True)
    
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
                if sim > 0.85:
                    assigned_groups[j] = group_id
                    results[j]['group_id'] = group_id

    # Mark is_lowest_price
    groups = {}
    for res in results:
        res['is_lowest_price'] = False
        gid = res['group_id']
        if gid not in groups:
            groups[gid] = []
        groups[gid].append(res)
        
    for gid, items in groups.items():
        min_item = min(items, key=lambda x: x['price'])
        min_item['is_lowest_price'] = True
        
    return results
