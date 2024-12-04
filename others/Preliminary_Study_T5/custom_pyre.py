import os
import subprocess


def run_pyre(cwd='input/'):
    # Convert to absolute path and use forward slashes
    cwd = os.path.abspath(cwd).replace("\\", "/")
    
    try:
        # Commenting out watchman command for now
        subprocess.run("watchman watch .".split(" "), cwd=cwd, check=True)
        
        # Run Pyre check instead of incremental for simplicity
        cmd = "pyre check"
        data = subprocess.check_output(cmd, cwd=cwd, shell=True, universal_newlines=True, stderr=subprocess.STDOUT)
        status = 0
    except subprocess.CalledProcessError as ex:
        data = ex.output
        status = ex.returncode
    except FileNotFoundError as ex:
        data = str(ex)
        status = 1
    except Exception as ex:
        data = str(ex)
        status = 1

    if data and data[-1:] == '\n':
        data = data[:-1]
    return status, data

# Example usage
if __name__ == "__main__":
    status, output = run_pyre('input')
    print(f"Status: {status}")
    print(f"Output:\n{output}")
