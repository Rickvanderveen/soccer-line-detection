# This code is for soccer field marking detction using two conditional GANs.

<img src="results/custom_data_selection/0001.jpg" width="900"/>

Most of the code comes from: https://github.com/meng-tsai/soccer-line-detection
Which is based on the paper: "Sports Camera Calibration via Synthetic Data".

Link: https://arxiv.org/abs/1810.10658
@article{chen2018sports, 
  title={Sports Camera Calibration via Synthetic Data},   
  author={Chen, Jianhui and Little, James J},   
  journal={arXiv preprint arXiv:1810.10658},   
  year={2018}   
}

## Getting Started
### Installation
Good luck!

#### Prepare data:
The images that will be used by the model are located in the 'datasets' folder. To train the model 3 folders are needed: train_phase_1, train_phase_2, val.
To test the model the images come from the test folder and to predict/generate the new images are put in the folder generating

<name_of_folder>/
|-- test/
|-- train_phase_1/
|-- train_phase_2/
|-- val/
|-- generating/

#### Training:
For training you can run the train shell script. Make sure to specify the correct dataroot (Name of the folder your images are located e.g. `--dataroot ./datasets/custom_data_selection`
```bash
sh train.sh
```

#### Testing:

#### Predicting:
To predict the lines of a new image you can use the following shell script (make sure to specify the correct dataroot).
```bash
sh generate.sh
```

## Citation
If you use this code for your research, please cite our papers.
```
@inproceedings{CycleGAN2017,
  title={Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networkss},
  author={Zhu, Jun-Yan and Park, Taesung and Isola, Phillip and Efros, Alexei A},
  booktitle={Computer Vision (ICCV), 2017 IEEE International Conference on},
  year={2017}
}

@inproceedings{isola2017image,
  title={Image-to-Image Translation with Conditional Adversarial Networks},
  author={Isola, Phillip and Zhu, Jun-Yan and Zhou, Tinghui and Efros, Alexei A},
  booktitle={Computer Vision and Pattern Recognition (CVPR), 2017 IEEE Conference on},
  year={2017}
}

```

## Acknowledgments
Code is inspired by https://github.com/meng-tsai/soccer-line-detection.
