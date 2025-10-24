import pandas as pd
import numpy as np
import os
import torch
import evaluate # Hugging Face library for metrics

from datasets import Dataset
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification, 
    TrainingArguments, 
    Trainer
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

# --- CONFIGURATION ---
BASE_PATH = r'C:\Users\DELL\Desktop\truthChain\backend\data-sets'
INPUT_FILE = 'unified_fake_news_data.csv'
OUTPUT_MODEL_DIR = './models/roberta_finetuned/final'
MODEL_NAME = "roberta-base"

# --- 1. METRICS DEFINITION ---
# Function to compute evaluation metrics (accuracy and F1 score)
def compute_metrics(eval_pred):
    """Computes F1 and Accuracy scores."""
    # p.predictions are the raw logits (scores) from the model
    # p.label_ids are the true labels
    predictions, labels = eval_pred
    
    # Convert logits to class predictions (0 or 1)
    preds = np.argmax(predictions, axis=1)
    
    return {
        'accuracy': accuracy_score(labels, preds),
        'f1_score': f1_score(labels, preds),
    }

# --- 2. DATA LOADING AND TOKENIZATION ---
def prepare_data_and_model():
    # Set device to GPU if available, otherwise CPU
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Load the unified dataset
    data_path = os.path.join(BASE_PATH, INPUT_FILE)
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Unified data file not found at: {data_path}. Please run preprocess_data.py first.")
        
    df = pd.read_csv(data_path)
    print(f"Total dataset size loaded: {len(df)} samples.")
    
    # Convert Pandas DataFrame to Hugging Face Dataset
    dataset = Dataset.from_pandas(df.reset_index(drop=True))
    
    # Initialize Tokenizer and Model
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    
    # num_labels=2 for binary classification (Fake/Real)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)
    model.to(device)

    # Tokenization Function
    def tokenize_function(examples):
        # Truncation=True cuts text longer than 512 (max for RoBERTa)
        # Padding='max_length' pads all samples to the same 512 length
        return tokenizer(examples["content"], padding="max_length", truncation=True, max_length=512)

    # Apply tokenization across the dataset
    tokenized_dataset = dataset.map(tokenize_function, batched=True)
    
    # Split the tokenized dataset into training and evaluation sets
    train_test_split_datasets = tokenized_dataset.train_test_split(test_size=0.2, seed=42)
    train_dataset = train_test_split_datasets["train"]
    eval_dataset = train_test_split_datasets["test"]
    
    print(f"Training samples: {len(train_dataset)}")
    print(f"Evaluation samples: {len(eval_dataset)}")
    
    return model, tokenizer, train_dataset, eval_dataset, device


# --- 3. TRAINING EXECUTION ---
# --- 3. TRAINING EXECUTION ---
def run_training(model, tokenizer, train_dataset, eval_dataset):
    print("\n--- Starting Model Fine-Tuning ---")
    
    # Define Training Arguments (Hyperparameters)
    training_args = TrainingArguments(
        output_dir='./models/roberta_finetuned/checkpoints',
        num_train_epochs=3,                     # Number of epochs
        per_device_train_batch_size=16,         # Batch size (adjust based on GPU memory)
        per_device_eval_batch_size=16,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir='./logs',
        logging_steps=500,
        
        # --- CRITICAL FIXES FOR TRANSFORMERS V4.38+ ---
        # 1. Renamed from evaluation_strategy to eval_strategy
        eval_strategy="epoch",            # Evaluate performance at the end of each epoch
        # 2. Renamed from save_strategy to save_strategy
        save_strategy="epoch",                  # Save checkpoint at the end of each epoch
        
        load_best_model_at_end=True,            # Load the model with the best evaluation metric (F1/Accuracy)
        report_to="none",                       # Prevent automatic logging to external services
    )

    # Initialize the Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        tokenizer=tokenizer,
        compute_metrics=compute_metrics,
    )

    # Train the model
    trainer.train()
    
    # Evaluate the final model on the held-out test set
    results = trainer.evaluate()
    print("\n--- Final Evaluation Results ---")
    print(results)
    
    # Save the final best model weights and tokenizer to the specified output directory
    final_output_path = os.path.join(OUTPUT_MODEL_DIR)
    trainer.save_model(final_output_path)
    tokenizer.save_pretrained(final_output_path)
    
    print(f"\nModel fine-tuning complete and saved to: {final_output_path}")


# --- MAIN EXECUTION ---
if __name__ == "__main__":
    try:
        model, tokenizer, train_dataset, eval_dataset, device = prepare_data_and_model()
        run_training(model, tokenizer, train_dataset, eval_dataset)
        
        # Optional: Clean up checkpoint directories to save disk space
        # import shutil
        # shutil.rmtree('./models/roberta_finetuned/checkpoints')
        
    except FileNotFoundError as e:
        print(f"\nFATAL ERROR: {e}")
        print("ACTION REQUIRED: Ensure 'unified_fake_news_data.csv' exists in the data-sets directory.")
    except Exception as e:
        print(f"\nAN UNEXPECTED ERROR OCCURRED DURING TRAINING: {e}")