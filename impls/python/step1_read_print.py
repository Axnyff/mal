from reader import read_str
from printer import pr_str

while True:
    line = raw_input("user> ")
    if (len(line) != 0):
        print(pr_str(read_str(line)))
