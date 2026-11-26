"""Genera los puntos faciales y la silueta que usa el avatar parlante del chat.

Uso:
    pip install mediapipe==0.10.14 pillow numpy
    python tools/generate_landmarks.py

Lee:     assets/philosophers/<id>.jpg   (retratos del chat)
Escribe: js/avatar-landmarks.js

Si cambias un retrato, vuelve a ejecutar este script.
"""
import json
import os
import sys

import mediapipe as mp
import numpy as np
from PIL import Image, ImageFilter

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDS = ['socrates', 'plato', 'aristotle']
UP = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]
LO = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]

face_mesh = mp.solutions.face_mesh.FaceMesh(
    static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.3)
seg_pose = mp.solutions.pose.Pose(static_image_mode=True, model_complexity=1, enable_segmentation=True, min_detection_confidence=0.3)
selfie = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=0)


def person_mask(img, cols=48):
    """Silueta de la persona (1) vs fondo (0) en una cuadrícula pequeña, como texto de dígitos 0-9.
    Sirve para que la respiración y la cabeza muevan solo a la persona y no el fondo."""
    a = np.array(img)
    res = seg_pose.process(a)
    m = res.segmentation_mask if res.segmentation_mask is not None else selfie.process(a).segmentation_mask
    if m is None:
        return None
    mimg = Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8))
    mimg = mimg.filter(ImageFilter.GaussianBlur(radius=img.width * 0.008))
    rows = max(2, round(cols * img.height / img.width))
    small = np.asarray(mimg.resize((cols, rows), Image.BILINEAR)).astype(np.float32) / 255
    return {'cols': cols, 'rows': rows, 'data': ''.join(str(int(round(v * 9))) for v in small.flatten())}


out = {}
for pid in IDS:
    path = os.path.join(ROOT, 'assets', 'philosophers', f'{pid}.jpg')
    if not os.path.exists(path):
        continue
    img = Image.open(path).convert('RGB')
    res = face_mesh.process(np.array(img))
    if not res.multi_face_landmarks:
        print('NO SE ENCONTRÓ LA CARA:', path)
        continue
    L = res.multi_face_landmarks[0].landmark
    P = lambda i: [round(L[i].x, 5), round(L[i].y, 5)]
    out[pid] = {
        'mouthL': P(61), 'mouthR': P(291),
        'upperInner': [P(i) for i in UP], 'lowerInner': [P(i) for i in LO],
        'chin': P(152), 'jawL': P(172), 'jawR': P(397), 'forehead': P(10),
        'eyes': [
            {'outer': P(33), 'inner': P(133), 'upper': P(159), 'lower': P(145)},
            {'outer': P(263), 'inner': P(362), 'upper': P(386), 'lower': P(374)},
        ],
        'mask': person_mask(img),
    }
    print('ok', pid)

js = ('// Puntos faciales y silueta de cada retrato (generados con tools/generate_landmarks.py).\n'
      '// Si cambias un retrato, vuelve a ejecutar ese script.\n'
      'window.AVATAR_LANDMARKS = ' + json.dumps(out, separators=(',', ':')) + ';\n')
with open(os.path.join(ROOT, 'js', 'avatar-landmarks.js'), 'w', encoding='utf-8') as f:
    f.write(js)
