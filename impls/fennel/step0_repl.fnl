(fn READ
  [str]
  str)

(fn EVAL
  [val]
  val)

(fn PRINT
  [val]
  val)

(fn rep
  [str]
  (PRINT (EVAL (READ str))))

(fn main
  []
  (io.write "user> ")
  (let [line (io.read)]
    (if line
      (do
        (print (rep line))
        (main))
      )))

(main)
