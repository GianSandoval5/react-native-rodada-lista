"""Verify the TypeScript adapter against isolated MobileLab and a real restart."""
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
def verify():
    binary=os.environ.get("MOBILELAB_BIN") or shutil.which("mobilelab")
    if not binary: raise SystemExit("Instala MobileLab 1.1.0 y define MOBILELAB_BIN o PATH.")
    binary=str(Path(binary).resolve())
    with tempfile.TemporaryDirectory(prefix="rodada_mobilelab_") as directory:
        sandbox=Path(directory)
        with socket.socket() as listener: listener.bind(("127.0.0.1",0));port=listener.getsockname()[1]
        config,count=re.subn(r"(?m)^([ \t]*port:[ \t]*)\d+[ \t]*$",rf"\g<1>{port}",(ROOT/"mobilelab.yaml").read_text(encoding="utf-8"),count=1)
        if count!=1: raise RuntimeError("No se pudo asignar un puerto aislado")
        (sandbox/"mobilelab.yaml").write_text(config,encoding="utf-8")
        shutil.copytree(ROOT/"mobilelab",sandbox/"mobilelab",ignore=shutil.ignore_patterns("*.db*","*.sqlite*","*.log","*.state.json"))
        compiled=sandbox/"compiled"
        subprocess.run(["node","node_modules/typescript/bin/tsc","--project","tool/tsconfig.integration.json","--outDir",str(compiled),"--rootDir","."],cwd=ROOT,check=True)
        base=f"http://127.0.0.1:{port}"
        def stop(process):
            if process.poll() is None: process.terminate()
            try: process.wait(timeout=10)
            except subprocess.TimeoutExpired: process.kill();process.wait(timeout=5)
        def start(log):
            process=subprocess.Popen([binary,"start","--headless"],cwd=sandbox,stdout=log,stderr=subprocess.STDOUT)
            try:
                for _ in range(100):
                    if process.poll() is not None: raise RuntimeError("MobileLab terminó antes de estar listo")
                    try:
                        with urllib.request.urlopen(base+"/api/bikes",timeout=1) as response:
                            if response.status==200:return process
                    except OSError: time.sleep(.1)
                raise RuntimeError("MobileLab no estuvo listo a tiempo")
            except BaseException: stop(process);raise
        def adapter(phase): subprocess.run(["node",str(compiled/"tool/integration.js"),base,phase],cwd=ROOT,check=True)
        with open(sandbox/"integration.log","w+",encoding="utf-8") as log:
            process=None
            try:
                process=start(log);adapter("write");stop(process);process=start(log);adapter("restart");print("PASS: adaptador TypeScript CRUD real; bici, componente y chequeo sobrevivieron al reinicio SQLite.")
            except BaseException: log.flush();log.seek(0);print(log.read());raise
            finally:
                if process is not None: stop(process)
if __name__=="__main__":verify()
