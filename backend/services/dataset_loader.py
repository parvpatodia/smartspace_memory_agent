"""
Dataset loader for Hugging Face datasets.
Loads and processes datasets for video processing.
"""

from datasets import load_dataset
from typing import Dict, List, Any, Optional
import os


class DatasetLoader:
    """Loader for Hugging Face datasets."""
    
    def __init__(self, dataset_name: str = "connectthapa84/OpenBiomedVid"):
        self.dataset_name = dataset_name
        self.dataset = None
        
    def load(self, split: Optional[str] = None) -> Dict:
        """
        Load the dataset from Hugging Face.
        
        Args:
            split: Dataset split to load (e.g., 'train', 'test', 'validation')
        
        Returns:
            Dataset object
        """
        print(f"📦 Loading dataset: {self.dataset_name}")
        
        try:
            if split:
                self.dataset = load_dataset(self.dataset_name, split=split)
            else:
                self.dataset = load_dataset(self.dataset_name)
            
            print(f"✅ Dataset loaded successfully")
            if hasattr(self.dataset, '__len__'):
                print(f"   Samples: {len(self.dataset)}")
            elif isinstance(self.dataset, dict):
                for split_name, split_data in self.dataset.items():
                    print(f"   {split_name}: {len(split_data)} samples")
            
            return self.dataset
            
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")
            raise
    
    def get_sample(self, index: int = 0, split: Optional[str] = None) -> Dict[str, Any]:
        """
        Get a single sample from the dataset.
        
        Args:
            index: Sample index
            split: Dataset split to use
        
        Returns:
            Sample dictionary
        """
        if self.dataset is None:
            self.load(split=split)
        
        if isinstance(self.dataset, dict):
            # If dataset has multiple splits, use first split or specified split
            if split and split in self.dataset:
                data = self.dataset[split]
            else:
                data = list(self.dataset.values())[0]
        else:
            data = self.dataset
        
        if index >= len(data):
            raise IndexError(f"Index {index} out of range for dataset of size {len(data)}")
        
        return data[index]
    
    def get_video_samples(self, num_samples: int = 10, split: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get multiple video samples from the dataset.
        
        Args:
            num_samples: Number of samples to retrieve
            split: Dataset split to use
        
        Returns:
            List of sample dictionaries
        """
        if self.dataset is None:
            self.load(split=split)
        
        if isinstance(self.dataset, dict):
            if split and split in self.dataset:
                data = self.dataset[split]
            else:
                data = list(self.dataset.values())[0]
        else:
            data = self.dataset
        
        max_samples = min(num_samples, len(data))
        return [data[i] for i in range(max_samples)]


# Example usage:
if __name__ == "__main__":
    loader = DatasetLoader("connectthapa84/OpenBiomedVid")
    dataset = loader.load()
    
    # Get a single sample
    sample = loader.get_sample(0)
    print(f"\nSample keys: {sample.keys()}")
    
    # Get multiple samples
    samples = loader.get_video_samples(5)
    print(f"\nRetrieved {len(samples)} samples")

