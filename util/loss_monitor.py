import csv
import matplotlib.pyplot as plt
import os
from config import PROJECT_ROOT
from datetime import datetime
from pathlib import Path


default_log_folder = PROJECT_ROOT.joinpath("loss_logs")


class LossMonitor:
    def __init__(self, file_path=None):
        self.fieldnames = [
            'epoch', 'seg_G_GAN', 'seg_G_L1', 'seg_D_real', 'seg_D_fake',
            'det_G_GAN', 'det_G_L1', 'det_D_real', 'det_D_fake'
        ]

        if file_path is None:
            if not os.path.exists(default_log_folder):
                os.makedirs(default_log_folder)
            self.file_path = default_log_folder.joinpath(self._create_file_name())
            if not os.path.exists(self.file_path):
                self._create_file_with_header()
        else:
            self.file_path = file_path
    
    def _create_file_with_header(self):
        with open(self.file_path, mode='x', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=self.fieldnames)
            writer.writeheader()
    
    def _create_file_name(self):
        current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"loss_history_{current_time}.csv"
        return file_name
    
    def _extract_numeric_values(self, tensor):
        # Extract numeric value from the tensor
        return float(tensor.item())
    
    def _transform_keys(self, loss_dict, prefix):
        transformed_dict = {}
        for key, value in loss_dict.items():
            transformed_key = f"{prefix}_{key}"
            transformed_dict[transformed_key] = self._extract_numeric_values(value)
        return transformed_dict
    

    def save_loss(self, epoch, seg_loss, det_loss):
        with open(self.file_path, mode='a', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=self.fieldnames)
            
            if not os.path.exists(self.file_path):
                writer.writeheader()
            
            # Transform the keys in seg_loss and det_loss to match the fieldnames
            seg_loss_transformed = self._transform_keys(seg_loss, 'seg')
            det_loss_transformed = self._transform_keys(det_loss, 'det')
            
            # Merge the transformed dictionaries
            row_data = {'epoch': epoch, **seg_loss_transformed, **det_loss_transformed}
            writer.writerow(row_data)


    def load_loss(self):
        if os.path.exists(self.file_path):
            with open(self.file_path, 'r') as file:
                # You can implement loading logic if needed
                pass
            return True
        else:
            print(f"No loss history found at {self.file_path}")
            return False

    def plot_loss(self):
        # Implement the plotting logic based on your CSV structure
        pass