#Application autonome 

# Import packages
import os
import argparse
import cv2
import numpy as np
#import sys
import time
from datetime import datetime
from threading import Thread
#import importlib.util
import socket


#Lib perso pour gérér les stream vidéo via des thread
from MG_HomeSecurity_Lib_VideoCapture import ThreadVideoCapture
#from MG_HomeSecurity_Lib_SocketCam import SocketCam
import MG_HomeSecurity_Lib_SocketCam as s

import MG_HomeSecurity_Lib_Cam as c

#Variables socket client
# ClientName = "Cam2"
# ReceiveEnable = 0
# ReceiveConfig = ""
# SendObjectName = ""
# Send_Score = "" 

#Variables camera
# Cam2 = Cam(1,1,1)
# print(Cam2.setting)
# print(Cam2.event)     

#------------------------------------------------------------------------------------

# Define and parse input arguments
parser = argparse.ArgumentParser()
parser.add_argument('--modeldir', help='Folder the .tflite file is located in',
                    default='Sample_TFLite_model')
parser.add_argument('--graph', help='Name of the .tflite file, if different than detect.tflite',
                    default='detect.tflite')
parser.add_argument('--labels', help='Name of the labelmap file, if different than labelmap.txt',
                    default='labelmap.txt')
parser.add_argument('--threshold', help='Minimum confidence threshold for displaying detected objects',
                    default=0.3)
parser.add_argument('--resolution', help='Desired webcam resolution in WxH. If the webcam does not support the resolutiaon entered, errors may occur.',
                    default='640x360')

args = parser.parse_args()
MODEL_NAME = args.modeldir
GRAPH_NAME = args.graph
LABELMAP_NAME = args.labels
min_conf_threshold = float(args.threshold)
resW, resH = args.resolution.split('x')
imW, imH = int(resW), int(resH)

# Import TensorFlow libraries
from tflite_runtime.interpreter import Interpreter
        
# Get path to current working directory
CWD_PATH = os.getcwd()

# Path to .tflite file, which contains the model that is used for object detection
PATH_TO_CKPT = os.path.join(CWD_PATH,MODEL_NAME,GRAPH_NAME)

# Path to label map file
PATH_TO_LABELS = os.path.join(CWD_PATH,MODEL_NAME,LABELMAP_NAME)

# Load the label map
with open(PATH_TO_LABELS, 'r') as f:
    labels = [line.strip() for line in f.readlines()]

# Have to do a weird fix for label map if using the COCO "starter model" from
# https://www.tensorflow.org/lite/models/object_detection/overview
# First label is '???', which has to be removed.
if labels[0] == '???':
    del(labels[0])

# Load the Tensorflow Lite model.
interpreter = Interpreter(model_path=PATH_TO_CKPT)
interpreter.allocate_tensors()

# Get model details
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
height = input_details[0]['shape'][1]
width = input_details[0]['shape'][2]

floating_model = (input_details[0]['dtype'] == np.float32)

input_mean = 127.5
input_std = 127.5

# Initialize frame rate calculation
frame_rate_calc = 1
freq = cv2.getTickFrequency()

#Choix des caméras à activer
EnableCam = 1

# Initialize video stream and threads
if EnableCam == 1 :
    # SÉCURITÉ : Les identifiants ne doivent JAMAIS être hardcodés dans le code source.
    # Pour une caméra IP avec authentification, utiliser une variable d'environnement.
    # Voir la configuration dans MG_HomeSecurity_Cam1.py pour plus de détails.
    # 
    # Configuration recommandée :
    # Créer un fichier .env avec : CAMERA2_RTSP_URL=rtsp://username:password@ip:port/path
    # puis utiliser : urlRTSP = os.getenv('CAMERA2_RTSP_URL', 'test.mp4')
    #
    # Note : test.mp4 est utilisé par défaut pour les tests locaux sans caméra IP
    urlRTSP = os.getenv('CAMERA2_RTSP_URL', 'test.mp4')
    videostream = ThreadVideoCapture(resolution=(imW,imH),url=urlRTSP).start(args)
    time.sleep(1)
    
    
# Instance Camera 2
#Cam2 = Camera() 
#Cam2.Enable = 1
#Cam2.Setting.F1.Z1.P1 = 0.31 # threshold
#Cam2.Setting.F1.Z1.P2 = "Aperson" # Filtre object_name
#Cam2.Setting.F1.Z1.P3 = "23-33-103-153" # Interest box pt1x pt1y pt2x pt2y 
#Cam2.ClientName = "Cam"
#Cam2.Event.F1.Z1.P1 = "Person" # ObjectName
#Cam2.Event.F1.Z1.P2 = 0.41 # Score
#Cam2.Event.F1.Z1.P3 = "22-32-102-152" # Object detection box pt1x pt1y pt2x pt2y  
#Cam2.MsgSend = ""
#Cam2.MsgReceive = ""
#Cam2.MsgSend_HMI = ""
#Cam2.MsgReceive_HMI = ""

c.Cam2.ClientName = "CAM2"

# Initialisation de la Class
SocketCam_1 = s.SocketCam()

print("Cam2 - EndInit" , datetime.now())

#for frame1 in camera.capture_continuous(rawCapture, format="bgr",use_video_port=True):
while True:
        
        TimeStartCycle = datetime.now()
        #print("Cam2 - StartCycle" , datetime.now())
        
        #-------------- SocketCam permet d'envoyer et revoir des données via le server -----------------#
        
        # Variables envoyées par la caméra
        SocketCam_1.ClientName = c.Cam2.ClientName
        #SocketCam_1.EventF1Z1P1 = object_name
        #SocketCam_1.EventF1Z1P2 = 0.3
        #SocketCam_1.EventF1Z1P3 = "pts"
        
        # Utilisation de la method
        SocketCam_1.RW()
        
        # Variables reçues par la caméra
        print("Enable " , SocketCam_1.Enable )
        print("SettingF1Z1P1 " , SocketCam_1.SettingF1Z1P1 ) # threshold
        print("SettingF1Z1P2 " , SocketCam_1.SettingF1Z1P2 ) # Filtre object_name
        print("SettingF1Z1P3 " , SocketCam_1.SettingF1Z1P3 ) # Interest box pt1x pt1y pt2x pt2y 
       
        #print("-----------------SocketCam_1.Enable =",SocketCam_1.Enable)   
        if int(SocketCam_1.Enable) == 1 :
            
            #--------------Traitement et détection------------------#
                    
        #Test pour eviter un arrêt à cause d'une erreur vidéo...
            try:
                
                # Start timer (for calculating frame rate)
                t1 = cv2.getTickCount()
                        
                # Grab frame from video stream
                frameread = videostream.read()
                #cv2.imshow('frame1', frame1)
                        
                #Si pas de resize en lecture video
                frameread = cv2.resize(frameread, (imW, imH))
    
                # Acquire frame and resize to expected shape [1xHxWx3]      
                frame = frameread.copy()        
                
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) #Préparation couleur
                frame_resized = cv2.resize(frame_rgb, (width, height)) #Redimentionnement taille pour TF
                input_data = np.expand_dims(frame_resized, axis=0) #conversion numérique exemple [ 89  89  93]
                
                
                # Normalize pixel values if using a floating model (i.e. if model is non-quantized)
                if floating_model:
                    input_data = (np.float32(input_data) - input_mean) / input_std
                
                # Perform the actual detection by running the model with the image as input
                interpreter.set_tensor(input_details[0]['index'],input_data)
                
                interpreter.invoke() #Prend environ 200ms
                
                # Retrieve detection results      
                boxes = interpreter.get_tensor(output_details[0]['index'])[0] # Bounding box coordinates of detected objects
                classes = interpreter.get_tensor(output_details[1]['index'])[0] # Class index of detected objects
                scores = interpreter.get_tensor(output_details[2]['index'])[0] # Confidence of detected objects
                #num = interpreter.get_tensor(output_details[3]['index'])[0]  # Total number of detected objects (inaccurate and not needed)
                
                #Dessin dun rectancle pour représenter un zone interdite
                #cv2.line(frame, (int(0),int(imH/2)), (int(imW/2),int(0)), (0, 0, 255), 2)
                #Zone1_pt1_x = int(imW/2)
                #Zone1_pt1_x = int(0)
                #Zone1_pt1_y = int(imH/2)
                Zone1_pt1_x = 20
                Zone1_pt1_y = int((imH/2)+150)   
                Zone1_pt1 = Zone1_pt1_x,Zone1_pt1_y
                            
                #Zone1_pt2_x = int(imW)
                #Zone1_pt2_y = int(0)
                Zone1_pt2_x = int(imW-100)
                Zone1_pt2_y = int((imH/2)-50)
                Zone1_pt2 = Zone1_pt2_x,Zone1_pt2_y
                            
                cv2.rectangle(frame, Zone1_pt1, Zone1_pt2, (0, 0, 255), 2)
                #pts = np.array([[10,5],[20,30],[70,20],[50,10]], np.int32)
                #cv2.polylines(frame, [pts], True, (0,255,255), 3)
    
                # Loop over all detections and draw detection box if confidence is above minimum threshold
                for i in range(len(scores)):
                    #if ((scores[i] > min_conf_threshold) and (scores[i] <= 1.0)):
                    if ((scores[i] > float(SocketCam_1.SettingF1Z1P1)  ) and (scores[i] <= 1.0)):  # SocketCam_1.SettingF1Z1P1  threshold
                       
                        
                        object_name = labels[int(classes[i])] # Look up object name from "labels" array using class index
                        
                        #Filtrate du type d'objet détecté
                        #print(object_name)
                        #if object_name == 'person' :
                        #if object_name != 'Pperson' :
                        #if object_name == SocketCam_1.SettingF1Z1P2 : # SocketCam_1.SettingF1Z1P2 Filtre object_name  
                        if object_name != SocketCam_1.SettingF1Z1P2 : # SocketCam_1.SettingF1Z1P2 Filtre object_name      
                            
                            #Récupération des informations de détection pour envois via socket...
                            SocketCam_1.EventF1Z1P1 = object_name
                            Send_Score = '{0:.2f}'.format(scores[i])
                            SocketCam_1.EventF1Z1P2 = Send_Score
                            
                            
                            # Get bounding box coordinates and draw box
                            # Interpreter can return coordinates that are outside of image dimensions, need to force them to be within image using max() and min()
                            #print(imH)
                            #print(imW)
                            ymin = int(max(1,(boxes[i][0] * imH)))
                            xmin = int(max(1,(boxes[i][1] * imW)))
                            ymax = int(min(imH,(boxes[i][2] * imH)))
                            xmax = int(min(imW,(boxes[i][3] * imW)))
                            
                            SocketCam_1.EventF1Z1P3 = ":" + str(xmin) + ":" + str(ymin) + ":" + str(xmax) + ":" + str(ymax) + ":"      # Object detection box pt1x pt1y pt2x pt2y 
                            
                            cv2.rectangle(frame, (xmin,ymin), (xmax,ymax), (10, 255, 0), 2)
                            
                            Detection_x = int(((xmax-xmin)/2) + xmin)
                            Detection_y = int(((ymax-ymin)/2) + ymin)
                            cv2.circle(frame, (Detection_x,Detection_y),10 , (10, 255, 0), 2)
                            #print('Détection -> x', Detection_x , 'ymin' , Detection_y)
                            #('Zone -> Zone1_pt1_x', Zone1_pt1_x , 'Zone1_pt1_y' , Zone1_pt1_y)
                            #print('Zone -> Zone1_pt2_x', Zone1_pt2_x , 'Zone1_pt2_y' , Zone1_pt2_y)
                            
                            
                            
                            if Detection_x > Zone1_pt1_x and Detection_x < Zone1_pt2_x and Detection_y < Zone1_pt1_y and Detection_y > Zone1_pt2_y :
                            
                                print('INTRUSION Cam2 - ENTREE -> ' , object_name)
                                print(datetime.now())
                                ResultatTest = 'INTRUSION Cam2 - ENTREE'
                                cv2.putText(frame, ResultatTest , (Detection_x, Detection_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                       
                            # Draw label
                            #object_name = labels[int(classes[i])] # Look up object name from "labels" array using class index
                            
                            #print(object_name)
                            #if object_name == 'person' :
                            
                            #cv2.rectangle(frame, (xmin,ymin), (xmax,ymax), (10, 255, 0), 2)
                      
                            label = '%s: %d%%' % (object_name, int(scores[i]*100)) # Example: 'person: 72%'
                            labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2) # Get font size
                            label_ymin = max(ymin, labelSize[1] + 10) # Make sure not to draw label too close to top of window
                            cv2.rectangle(frame, (xmin, label_ymin-labelSize[1]-10), (xmin+labelSize[0], label_ymin+baseLine-10), (255, 255, 255), cv2.FILLED) # Draw white box to put label text in
                            cv2.putText(frame, label , (xmin, label_ymin-7), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2) # Draw label text
                                                      
                # Calculate framerate
                t2 = cv2.getTickCount()
                time1 = (t2-t1)/freq
                frame_rate_calc= 1/time1
                
                # Draw framerate in corner of frame
                cv2.putText(frame,'FPS: {0:.2f}'.format(frame_rate_calc),(530,20),cv2.FONT_HERSHEY_SIMPLEX,0.7,(255,0,255),2,cv2.LINE_AA)
                
                # All the results have been drawn on the frame, so it's time to display it.
                cv2.imshow('Cam2 - ENTREE', frame)
    
    
    
                # Press 'q' to quit
                if cv2.waitKey(1) == ord('q'):
                    break
                
                #print("Cam2 - EndCycle" , datetime.now())
                #print("Cam2 - Cycle" , datetime.now() - TimeStartCycle)
            
            except:
                print("Catch error Cam")
                ##time.sleep(2)
                # Initialize video stream
                ##videostream = VideoStream(resolution=(imW,imH),framerate=30).start()
                ##time.sleep(1)
                ##print("--> ReTry")
                # while True:
                #     print("Catch error 3 press")
                #     time.sleep(5)
                #     print("Press 'q' to quit")
                #     if cv2.waitKey(1) == ord('q'):
                #         break
    
    
# Clean up
cv2.destroyAllWindows()
videostream.stop()
