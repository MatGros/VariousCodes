#Cette Lib permet de lancer une capture dans un Thread

# Import packages
import cv2
from threading import Thread
import time
from datetime import datetime

class ThreadVideoCapture :
    
    # Initialisation
    def __init__(self, resolution=(640,360),url=""):
        self.stream = cv2.VideoCapture(url)
        #self.stream = cv2.VideoCapture("rtsp://username:password@192.168.x.x:554/Streaming/Channels/2")
        #self.stream = cv2.VideoCapture(STREAM_URL)
        #self.stream = cv2.VideoCapture(0)
        #self.stream = cv2.VideoCapture("/home/pi/Desktop/Partage/Vidéos/00000000662009413.mp4")
        # Initialize the PiCamera and the camera image stream
        #ret = self.stream.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG')) #A déséactiver si webcam (semble servir pour camera PI intégrée)
        ret = self.stream.set(3,resolution[0])
        ret = self.stream.set(4,resolution[1])
            
        # Read first frame from the stream
        (self.grabbed, self.frame) = self.stream.read()

        # Variable to control when the camera is stopped
        self.stopped = False
        

    def start(self,args):
    # Start the thread that reads frames from the video stream
        Thread(target=self.update,args=()).start()
        return self

    def update(self):
        # Keep looping indefinitely until the thread is stopped
        while True:
            TimeStartCycle = datetime.now()
            # If the camera is stopped, stop the thread
            if self.stopped:
                # Close camera resources
                self.stream.release()
                return

            # Otherwise, grab the next frame from the stream
            (self.grabbed, self.frame) = self.stream.read()
            
            #time.sleep(0.1) #Cette temporisation permet de limiter le cycle des captures
            #print("Cam1 - CAPTURECycle" , datetime.now() - TimeStartCycle)

    def read(self):
    # Return the most recent frame
        return self.frame

    def stop(self):
    # Indicate that the camera and thread should be stopped
        self.stopped = True
        