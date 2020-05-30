class Env:
    def __init__(self, outer = None):
        self.data = {}
        self.outer = outer

    def set(self, key, value):
        if value["type"] != "error":
                self.data[key] = value

    def get(self, key):
        if key in self.data:
            return self.data[key]
        if self.outer != None:
            return self.outer.get(key)
        return {
                "type": "error",
                "value": {
                    "type": "string",
                    "value": "'" + key + "' not found"
                }
        }
