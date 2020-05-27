(ns mal.step1
  (:require [clojure.string :as str]))

(def readline (js/require "readline"))
(def rl
  (.createInterface 
    readline 
    #js 
    {
     :input (.-stdin js/process)
     :output (.-stdout js/process)
     :terminal true
     }
    ))
(defn prompt
  []
  (print "user> "))

(defn handle-line
  [line]
  (let
    [
     trimmed-line (str/trim line)
     tokens (str/split trimmed-line #"\s+")]
    (println
      (reduce
        (fn [acc token]
          (str acc
               (case token
                 "(" token
                 ")" token
                 (str token " "))))
        "" tokens))
    (prompt)))

(prompt)
(.on rl "line" handle-line)
