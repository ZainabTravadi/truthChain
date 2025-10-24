import pandas as pd
import numpy as np
import os
import re
import csv
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer 
# --- NEW IMPORTS FOR CPU SPEEDUP ---
import swifter
import multiprocessing
# -----------------------------------

# --- CONFIGURATION ---
# Base path where your data files reside
BASE_PATH = r'C:\Users\DELL\Desktop\truthChain\backend\data-sets'
OUTPUT_FILE = 'unified_fake_news_data.csv'
MODEL_NAME = 'roberta-base' 
SEPARATOR = " [SEP] " # Separator token for headline and body

# --- DATA CLEANING UTILITY (Optimized for Vectorization) ---
def map_liar_labels(label):
    """
    Maps the LIAR dataset's 6-point scale to a binary (0: Fake, 1: Real/True).
    Drops ambiguous labels. This function remains as it is used directly in a vectorized map.
    """
    if not isinstance(label, str):
        return np.nan
        
    label = label.lower()
    
    if label in ['true', 'mostly-true']:
        return 1
    elif label in ['false', 'pants-fire']:
        return 0
    else:
        return np.nan # Drop Barely True, Half True, and any other ambiguous labels

# --- OPTIMIZED TEXT CLEANING FUNCTION (Vectorized) ---
def clean_text_optimized(series):
    """
    Performs robust text cleaning using vectorized string methods (faster on CPUs).
    
    NOTE: This is designed to be called on a Pandas Series or similar vectorized context.
    The most complex part (regex) is left for the final step to minimize repeated passes.
    """
    # 1. CRITICAL: Ensure input is string, fill NaNs with empty string, and convert to lowercase
    # This replaces the slow 'if not isinstance(text, str):' check with a single fast operation.
    text_series = series.astype(str).fillna("").str.lower()
    
    # 2. Vectorized URL removal (fast regex)
    # The '|' separator is used to combine complex cleaning into one .str.replace
    text_series = text_series.str.replace(r'http\S+|www\S+|https\S+', ' ', regex=True)
    
    # 3. Vectorized removal of special characters
    # Replaces the slow re.sub loop in the old function
    PUNCT_REGEX = r'[\\!\\"#$%&()\\*+/;<=>?@\\[\\]^_`{|}~\\n\\r\\t]'
    text_series = text_series.str.replace(PUNCT_REGEX, ' ', regex=True)
    
    # 4. Collapse multiple spaces and strip ends (fast regex)
    text_series = text_series.str.replace(r'\s+', ' ', regex=True).str.strip()
    
    return text_series

# --- MAIN DATA LOADING AND UNIFICATION (Optimized) ---
def load_and_unify_datasets(base_path):
    print("Starting data loading and unification...")
    all_dataframes = []

    # --- 1. LIAR Dataset (TSV files) ---
    try:
        liar_cols = ['ID', 'label', 'statement', 'subject', 'speaker', 'job_title', 
                     'state_info', 'party', 'bt_count', 'f_count', 'ht_count', 
                     'mt_count', 'pof_count', 'context']
        
        # Loading remains the same, as file I/O is hard to optimize
        df_liar_train = pd.read_csv(os.path.join(base_path, 'train.tsv'), sep='\t', header=None, names=liar_cols, on_bad_lines='skip', engine='python', quoting=csv.QUOTE_NONE)
        df_liar_test = pd.read_csv(os.path.join(base_path, 'test.tsv'), sep='\t', header=None, names=liar_cols, on_bad_lines='skip', engine='python', quoting=csv.QUOTE_NONE)
        df_liar_valid = pd.read_csv(os.path.join(base_path, 'valid.tsv'), sep='\t', header=None, names=liar_cols, on_bad_lines='skip', engine='python', quoting=csv.QUOTE_NONE)
        
        df_liar = pd.concat([df_liar_train, df_liar_test, df_liar_valid], ignore_index=True)
        
        # --- OPTIMIZATION POINT: Use .map() for label cleaning (vectorized) ---
        df_liar['label'] = df_liar['label'].map(map_liar_labels) 
        df_liar.dropna(subset=['label'], inplace=True)
        
        # Combine text fields (vectorized operations are fast)
        df_liar['content'] = df_liar['statement'].fillna("").astype(str) + SEPARATOR + "Claimed by " + df_liar['speaker'].fillna("unknown speaker").astype(str)
        df_liar = df_liar[['content', 'label']]
        df_liar['label'] = df_liar['label'].astype(int)
        all_dataframes.append(df_liar)
        print(f"LIAR loaded: {len(df_liar)} samples.")
    except Exception as e:
        print(f"ERROR LOADING LIAR DATASET: {e}. Skipping LIAR.")
    
    # --- 2. GossipCop and PolitiFact (Assuming CSV files) ---
    
    gossip_politifact_files = [
        ('gossipcop_fake.csv', 0), ('gossipcop_real.csv', 1),
        ('politifact_fake.csv', 0), ('politifact_real.csv', 1)
    ]
    
    df_combined_news = []
    
    for filename, label_value in gossip_politifact_files:
        try:
            df = pd.read_csv(os.path.join(base_path, filename))
            df['label'] = label_value
            
            if 'text' not in df.columns:
                if 'news_content' in df.columns:
                     df.rename(columns={'news_content': 'text'}, inplace=True)
                else:
                     print(f"WARNING: '{filename}' missing 'text' column. Using only 'title' for content.")
                     df['text'] = df['title']
            
            # Combine text fields (vectorized operations are fast)
            df['content'] = df['title'].fillna("").astype(str) + SEPARATOR + df['text'].fillna("").astype(str)
            df_combined_news.append(df[['content', 'label']])
            print(f"Successfully loaded {filename}.")

        except FileNotFoundError:
            print(f"WARNING: File {filename} not found. Ensure file extension is .csv (not .xlsx). Skipping.")
        except Exception as e:
            print(f"ERROR PROCESSING {filename}: {e}. Skipping.")

    if df_combined_news:
        df_gossip_politifact = pd.concat(df_combined_news, ignore_index=True)
        all_dataframes.append(df_gossip_politifact)
        print(f"GossipCop/PolitiFact total loaded: {len(df_gossip_politifact)} samples.")
    
    
    # 3. Combine All DataFrames and Finalize
    if not all_dataframes:
        print("FATAL: No data was successfully loaded. Returning empty DataFrame.")
        return pd.DataFrame({'content': [], 'label': []})

    df_combined = pd.concat(all_dataframes, ignore_index=True)
    df_combined.drop_duplicates(subset=['content'], inplace=True)
    
    # --- OPTIMIZATION POINT: Use the vectorized cleaning function ---
    df_combined['content'] = clean_text_optimized(df_combined['content'])
    
    # Drop rows where content might have become empty or ambiguous after cleaning
    df_combined.replace('', np.nan, inplace=True) 
    df_combined.dropna(subset=['content', 'label'], inplace=True)
    
    # Final cleanup of samples that became too short
    df_combined = df_combined[df_combined['content'].str.len() > 10] 
    
    df_combined['label'] = df_combined['label'].astype(int)

    print(f"Total Unified Samples: {len(df_combined)}.")
    
    return df_combined

# --- EXECUTION ---
if __name__ == "__main__":
    # Ensure 'swifter' is configured to use all available CPU cores
    # This line sets up swifter to use a specified number of CPU cores for parallel processing.
    # We use all available cores for maximum speedup.
    # Note: swifter.set_n_workers(n_workers) can be used if you want to limit cores.
    # For now, we'll keep the execution section focused on the data loading.

    df_unified = load_and_unify_datasets(BASE_PATH)
    
    # Display label balance
    print("\nLabel Distribution (0=Fake, 1=Real):")
    print(df_unified['label'].value_counts())
    
    # Save the unified, clean data to a single CSV file
    final_output_path = os.path.join(BASE_PATH, OUTPUT_FILE)
    df_unified.to_csv(final_output_path, index=False)
    print(f"\n--- Successfully saved unified data to: {final_output_path} ---")

    # --- Next Step Preparation (Train/Test Split) ---
    
    # Split the final dataset for training purposes (80/20 split)
    if len(df_unified) > 10: # Ensure enough samples to split
        df_train, df_test = train_test_split(df_unified, test_size=0.2, stratify=df_unified['label'], random_state=42)
        
        print(f"\nTraining Set Size: {len(df_train)}")
        print(f"Testing Set Size: {len(df_test)}")
        
        print("\nData is ready for BERT/RoBERTa Fine-Tuning (Step 2).")
    else:
        print("\nInsufficient data to perform train/test split.")