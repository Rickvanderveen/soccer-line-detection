python test_two_pix2pix.py \
    --dataroot ./datasets/custom_data_random_selection \
    --which_direction AtoB \
    --model two_pix2pix \
    --name soccer_seg_detection_pix2pix \
    --output_nc 1 \
    --dataset_mode aligned \
    --which_model_netG unet_256 \
    --norm batch \
    --how_many 10