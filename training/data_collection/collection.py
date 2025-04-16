import cv2
import numpy as np
import os

# Enter folder, make folder, then take input in loop

ip_webcam = input('Webcam IP: ')
category = input('Image folder: ')

if not os.path.exists(os.path.join(os.getcwd(), category)):
    os.mkdir(category)

ply_number = 0
while True:
    key = input(f'Move {ply_number} image: ')
    if key == 'quit':
        break
    cap = cv2.VideoCapture(f'http://{ip_webcam}/video')
    ret, frame = cap.read()
    if not ret:
        print('End')
        break
    cv2.imwrite(os.path.join(os.getcwd(), category, f'{ply_number:>04}.png'), frame)
    ply_number += 1
