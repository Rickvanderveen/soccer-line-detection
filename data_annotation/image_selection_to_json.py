"""
Creates a JSON file containing the paths of all images used in a set. A set is a
folder specified by the variable NAME. A set exists in the folder
data_annotation/static/images/NAME. The set NAME is a subset of all the images
that exist in the data folder.
"""
from pathlib import Path
import os
import json


NAME = "custom_data_selection"


def export_dict_to_json(data_dict, json_filename):
    with open(json_filename, 'w') as json_file:
        json.dump(data_dict, json_file, indent=4)


img_dir = Path(__file__).resolve().parent.joinpath("static", "images")

data_folder = Path(__file__).resolve().parent.parent.joinpath("data")
data_sub_folders = os.listdir(data_folder)

img_dict = {"image_selection": {}}
model_phases = ["train_phase_1", "val", "test"]
for model_phase in model_phases:
    phase_path_folder = img_dir.joinpath("input", NAME, model_phase)

    phase_images_folder = os.listdir(phase_path_folder)

    for img in phase_images_folder:
        for data_sub_folder in data_sub_folders:
            sub_folder_path = data_folder.joinpath(data_sub_folder)
            for original_img in sorted(os.listdir(sub_folder_path)):
                if img == original_img:
                    path_parts = sub_folder_path.joinpath(original_img).parts
                    data_index = path_parts.index('data')
                    desired_parts = path_parts[data_index:]
                    path = str(Path(*desired_parts))

                    phase_name = model_phase
                    if model_phase == "train_phase_1":
                        phase_name = "train"

                    if phase_name not in img_dict["image_selection"]:
                        img_dict["image_selection"][phase_name] = [path]
                    else:
                        img_dict["image_selection"][phase_name].append(path)

for key in img_dict["image_selection"].keys():
    img_dict["image_selection"][key].sort()

export_dict_to_json(img_dict, img_dir.joinpath("input", NAME, "selected_files.json"))