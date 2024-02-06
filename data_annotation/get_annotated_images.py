from pathlib import Path
import os
import shutil


def copy_file(source_path, destination_path):
    try:
        shutil.copy2(source_path, destination_path)
        print(f"File copied from {source_path} to {destination_path}")
    except IOError as e:
        print(f"Unable to copy file. Error: {e}")


img_dir = Path("./static/images")
datafolder_name = "custom_data_random_selection"

model_phases = ["train_phase_1", "train_phase_2", "val", "test"]

folder1 = "input"
folder2 = "annotated"

output_folder_lines = Path("./field_images", "line_annotated")
output_folder_segmentation = Path("./field_images", "segmentation_annotated")
if not os.path.exists(output_folder_lines):
    os.makedirs(output_folder_lines)
if not os.path.exists(output_folder_segmentation):
    os.makedirs(output_folder_segmentation)


for model_phase in model_phases:
    phase_path_folder1 = img_dir.joinpath(folder1, datafolder_name, model_phase)
    phase_path_folder2 = img_dir.joinpath(folder2, datafolder_name, model_phase)

    phase_images_folder1 = os.listdir(phase_path_folder1)
    phase_images_folder2 = os.listdir(phase_path_folder2)


    for img in phase_images_folder1:
        if img not in phase_images_folder2:
            raise Exception(f"Img '{img}' only exists in input but not in annotated")
        
        input_img = phase_path_folder1.joinpath(img)
        annotated_img = phase_path_folder2.joinpath(img)

        output_folder = output_folder_lines
        if model_phase == "train_phase_1":
            output_folder = output_folder_segmentation

        output_img_path = output_folder.joinpath(annotated_img.name)
        copy_file(annotated_img, output_img_path)

