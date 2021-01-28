import Jasmine from "jasmine"
import path from "path"

const jasmine = new Jasmine({})

jasmine.loadConfigFile(path.join(__dirname, "../jasmine.json"))
jasmine.execute()