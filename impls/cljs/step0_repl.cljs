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

(print "user> ")
(.on rl "line"
     (fn [v]
       (js/console.log v)
       (print "user> ")))
