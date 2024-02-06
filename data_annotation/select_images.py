import os
from pathlib import Path
import random
import shutil

def copy_files(source_folder, destination_folder, file_names):
    source_folder = Path(source_folder)
    destination_folder = Path(destination_folder)

    for file_name in file_names:
        source_path = source_folder / file_name
        destination_path = destination_folder / file_name

        if source_path.is_file():
            shutil.copy(source_path, destination_path)


input_dir = Path("./../datasets/custom_data")
input_dir = input_dir.resolve()

images = os.listdir(input_dir)

N_IMAGES = 100
random.seed(1)
selected_items = random.choices(images, k=N_IMAGES)

train_val_test_ratio = [0.7, 0.2, 0.1]

n_train = int(N_IMAGES * train_val_test_ratio[0])
n_val = int(N_IMAGES * train_val_test_ratio[1])
n_test = N_IMAGES - n_train - n_val

train_images = selected_items[0:n_train]
val_images = selected_items[n_train:n_train + n_val]
test_images = selected_items[n_train + n_val:]

output_dir = Path("./static/images/input")

print(f"Selected {N_IMAGES} items. Copy to directory:")
output_folder = input("Type name of folder: ")

output_dir = output_dir.joinpath(output_folder).resolve()

train_phase_1_dir = output_dir.joinpath("train_phase_1").resolve()
train_phase_2_dir = output_dir.joinpath("train_phase_2").resolve()
val_dir = output_dir.joinpath("val").resolve()
test_dir = output_dir.joinpath("test").resolve()

dirs = (train_phase_1_dir, train_phase_2_dir, val_dir, test_dir)

if not output_dir.exists():
    os.makedirs(output_dir)
    for dir in dirs:
        os.makedirs(dir.resolve())
        print(f"Created a new folder: {dir}")

copy_files(input_dir, train_phase_1_dir, train_images)
copy_files(input_dir, train_phase_2_dir, train_images)
copy_files(input_dir, val_dir, val_images)
copy_files(input_dir, test_dir, test_images)
    
print(f"Copied to {output_dir}")