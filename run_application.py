#!/usr/bin/env python3
"""
QIP Data Analysis Tool - Single Execution Script

This script starts both the backend API server and the frontend development server
to run the complete QIP Data Analysis Tool application.
"""

import os
import sys
import subprocess
import threading
import time
import webbrowser
import signal
from pathlib import Path

# Global variables to hold process references
backend_process = None
frontend_process = None

def start_backend():
    """Start the backend FastAPI server"""
    global backend_process
    backend_path = Path(__file__).parent / "backend"
    os.chdir(backend_path)
    
    try:
        # Start the backend server
        backend_process = subprocess.Popen([
            sys.executable, "main.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        return backend_process
    except FileNotFoundError:
        print("Error: Python interpreter not found. Please make sure Python is installed and in your PATH.")
        sys.exit(1)
    except Exception as e:
        print(f"Error starting backend server: {e}")
        sys.exit(1)

def start_frontend():
    """Start the frontend Vite development server"""
    global frontend_process
    frontend_path = Path(__file__).parent / "frontend"
    os.chdir(frontend_path)
    
    try:
        # Start the frontend server
        frontend_process = subprocess.Popen([
            "npx", "vite"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=True)
        
        return frontend_process
    except FileNotFoundError:
        print("Error: Node.js or npx not found. Please make sure Node.js is installed and in your PATH.")
        sys.exit(1)
    except Exception as e:
        print(f"Error starting frontend server: {e}")
        sys.exit(1)

def open_browser():
    """Open the application in the default web browser after a delay"""
    time.sleep(5)  # Wait for servers to start
    try:
        webbrowser.open("http://localhost:5173")
    except Exception as e:
        print(f"Could not open browser automatically: {e}")
        print("Please manually open your browser and go to http://localhost:5173")

def check_dependencies():
    """Check if required dependencies are available"""
    import shutil
    
    # Check if Python is available
    if not shutil.which(sys.executable):
        print("Error: Python interpreter not found. Please make sure Python is installed and in your PATH.")
        return False
    
    # Check if Node.js is available
    if not shutil.which("node"):
        print("Error: Node.js not found. Please make sure Node.js is installed and in your PATH.")
        return False
    
    # Check if npm is available
    if not shutil.which("npm"):
        print("Error: npm not found. Please make sure Node.js is installed and in your PATH.")
        return False
    
    # Check if npx is available
    if not shutil.which("npx"):
        print("Error: npx not found. Please make sure Node.js is installed and in your PATH.")
        return False
    
    # Check if backend requirements are installed
    backend_path = Path(__file__).parent / "backend"
    os.chdir(backend_path)
    try:
        import fastapi, uvicorn, pandas, numpy, scipy, openpyxl, xlsxwriter, matplotlib
    except ImportError as e:
        print(f"Error: Backend dependencies not found: {e}")
        print("Please run InstallDependencies.bat or InstallDependencies.ps1 first.")
        return False
    
    # Check if frontend dependencies are installed
    frontend_path = Path(__file__).parent / "frontend"
    package_json_path = frontend_path / "package-lock.json"
    node_modules_path = frontend_path / "node_modules"
    if not package_json_path.exists() or not node_modules_path.exists():
        print("Warning: Frontend dependencies may not be installed.")
        print("Please run InstallDependencies.bat or InstallDependencies.ps1 if you encounter issues.")
    
    return True

def main():
    print("Starting QIP Data Analysis Tool...")
    
    # Check dependencies before starting
    if not check_dependencies():
        sys.exit(1)
    
    print("Initializing backend server...")
    
    # Start backend server
    start_backend()
    
    print("Initializing frontend server...")
    
    # Start frontend server
    start_frontend()
    
    # Open browser in a separate thread
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    print("\nQIP Data Analysis Tool is starting...")
    print("Backend server: http://localhost:8000")
    print("Frontend server: http://localhost:5173")
    print("Application will be available at: http://localhost:5173")
    print("\nPress Ctrl+C to stop the application")
    
    try:
        # Wait for the backend process (this will keep the script running)
        backend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down QIP Data Analysis Tool...")
        if backend_process and backend_process.poll() is None:
            backend_process.terminate()
        if frontend_process and frontend_process.poll() is None:
            frontend_process.terminate()
        print("Application stopped.")

if __name__ == "__main__":
    main()