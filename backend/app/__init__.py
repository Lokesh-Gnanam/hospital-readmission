import sys
import os

# Dynamically append the sibling 'src' directory to sys.path so that
# backend services can import 'preprocessing.py' cleanly.
current_dir = os.path.dirname(os.path.abspath(__file__)) # hospital-readmission/backend/app
backend_dir = os.path.dirname(current_dir)             # hospital-readmission/backend
root_dir = os.path.dirname(backend_dir)                # hospital-readmission
src_dir = os.path.join(root_dir, "src")

if src_dir not in sys.path:
    sys.path.append(src_dir)
