import pandas as pd
import numpy as np
from pathlib import Path

BASE = Path(__file__).parent
res_df = pd.read_csv(BASE / "data" / "resources.csv")

np.random.seed(42)
web_ids = res_df[res_df['skill_id'].isin([1, 2, 3, 4, 5])]['id'].tolist()
ds_ids = res_df[res_df['skill_id'].isin([6, 7, 8, 9, 15])]['id'].tolist()
be_ids = res_df[res_df['skill_id'].isin([3, 5, 10, 11, 12, 13, 14])]['id'].tolist()

rows = []
# 15 web learners
for u in range(101, 116):
    n = np.random.randint(4, 8)
    chosen = np.random.choice(web_ids, size=min(n, len(web_ids)), replace=False)
    for rid in chosen:
        rows.append({'user_id': u, 'resource_id': int(rid), 'rating': float(np.random.choice([4.0, 4.5, 5.0])), 'is_synthetic': True})

# 15 data science learners
for u in range(116, 131):
    n = np.random.randint(4, 8)
    chosen = np.random.choice(ds_ids, size=min(n, len(ds_ids)), replace=False)
    for rid in chosen:
        rows.append({'user_id': u, 'resource_id': int(rid), 'rating': float(np.random.choice([4.0, 4.5, 5.0])), 'is_synthetic': True})

# 10 backend learners
for u in range(131, 141):
    n = np.random.randint(4, 8)
    chosen = np.random.choice(be_ids, size=min(n, len(be_ids)), replace=False)
    for rid in chosen:
        rows.append({'user_id': u, 'resource_id': int(rid), 'rating': float(np.random.choice([4.0, 4.5, 5.0])), 'is_synthetic': True})

df = pd.DataFrame(rows)
target_path = BASE / "data" / "synthetic_interactions.csv"
df.to_csv(target_path, index=False)
print(f"Generated {len(df)} synthetic interaction rows across {df['user_id'].nunique()} users into {target_path.name}")
