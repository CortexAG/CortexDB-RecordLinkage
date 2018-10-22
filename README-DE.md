CortexDB Record Linkage
=======================

Die englische Version dieses Text ist hier zu finden: [README.md](./README.md)

Aus Sicht vieler Fachbereiche und durch Anpassungen rechtlicher Gegebenheiten (GDPR/DSGVO) ist das Finden und Zusammenführen eines eindeutigen Datensatzes je Kunde, eines Vertrages oder Produktes notwendig. Erst das Auffinden des eindeutigen Datensatzes zu einem Kunden oder einem Produkt ermöglicht es, alle Zusammenhänge zu diesem Ausgangsdatensatz aufzufinden, zu sichten und zu bearbeiten. Diesen "golden record" gilt es daher zu erreichen, wenn mehrere Datenbanksysteme betrieben werden.

Der Betrieb unterschiedlicher Datenbanken führt allerdings unweigerlich zu Unterschieden im Datenhaushalt. Selbst mit Hilfswerkzeugen und Schnittstellen zwischen den Systemen sind typische Diskrepanzen unvermeidbar: 

- fehlende Informationen
- fehlerhafte Informationen
- veraltete Informationen
- unterschiedliche Datenschema (z.B. verschiedene Einheiten für gleiche Angaben)

Vorbereitende Schritte
----------------------

Nach der Datenübermittlung ist daher im ersten Schritt eine Datenbereinigung (data cleansing) durchzuführen. Dabei werden die Art der Daten, die Prüfung auf auf Vollständigkeit und die Validierung (z.B. Adressprüfung) der Daten durchgeführt. Auf diese Weise können die verfügbaren Informationen über die verschiedenen Datenquellen hinweg bereinigt und standardisiert werden, um falsche Übereinstimmungen zu minimieren. Danach ist eine Datenanalyse durchzuführen, um festzustellen, ob die gelieferten Daten den Erwartungen und Vorgaben ("value sets) entsprechen.

Sind die vorhergehenden Schritte durchlaufen, können gleichartige Datensätze miteinander verknüpft ("verlinkt") werden. Hierfür stehen zwei Haupttypen von Verknüpfungsalgorithmen zur Verfügung: "deterministisch" und "probabilistisch".

Der deterministische Ansatz
---------------------------

Über einen deterministischen Algorithmus wird bestimmt, ob ein Datensatz-Paar in einer bestimmten Menge an Identifikatoren (Feldinhalte) übereinstimmt oder nicht. Die Übereinstimmung wird hierbei als "alles-oder-nichts"-Ergebnis bewertet.

Beispiel: Gegeben seien vier Datensätze mit Vor- und Nachname:

```
Datensatz 1: 	Kerstin Meyer
Datensatz 2: 	Kerstin Mayer
Datensatz 3: 	Kirsten Meyer
Datensatz 4: 	Kirsten Mayer
```

Aus deterministischer Sicht liegen jeweils nur zwei Übereinstimmungen der Vornamen und Nachnamen vor. Datensatz 1 und 2, sowie 3 und 4 stimmen im Vornamen überein; die Datensätze 1 und 3, sowie 2 und 4 stimmen im Nachnamen überein. Es liegt daher keine 100%-Übereinstimmung vor. Mit dem deterministischen Ansatz wird also kein Link gebildet.

Die Prüfung auf Übereinstimmung kann hierbei also nur über mehrere Schritte erfolgen. Der Vergleich der Datensätze je Feld führt damit bei jedem Datensatz zu zwei Links die mit 50% Übereinstimmung bewertet werden können (ein Feld stimmt immer mit einem Feld aus einem anderen Datensatz überein; das andere nicht).

Der deterministische Ansatz ignoriert daher die Tatsache, dass bestimmte  bestimmte Werte eine höhere Ungenauigkeit besitzen als andere. Um dieses zu berücksichtigen muss auf einen probabilistischen Ansatz zurückgegriffen werden.

Der probabilistische Ansatz
---------------------------

Nach dem von Fellegi und Sunter entwickelten Modell wird zwischen Matches, mögliche Matches oder Nicht-Matches unterschieden; basierend auf der Berechnung der Verknüpfungspunkte und der Anwendung von Entscheidungsregeln. 

siehe: ["A theory for record linkage", Ivan P. Fellegi and Alan B. Sunter](https://courses.cs.washington.edu/courses/cse590q/04au/papers/Felligi69.pdf)

oder: [destatis.de: Automatisierte Zusammenführung von Daten – Das Modell von Fellegi und Sunter](https://www.destatis.de/DE/Publikationen/WirtschaftStatistik/Gastbeitraege/ZusammenfuehrungDaten42005.pdf?__blob=publicationFile)

Der probabilistische Ansatz bewertet bei dem Vergleich der Feldinhalte die Übereinstimmung als Wahrscheinlichkeiten.

Beispiel: Gegeben seien vier Datensätze mit Vor- und Nachname:

```
Datensatz 1: 	Kerstin Meyer
Datensatz 2: 	Kerstin Mayer
Datensatz 3: 	Kirsten Meyer
Datensatz 4: 	Kirsten Mayer
```

Aus dem Vornamen `Kerstin` kann durch das Vertauschen von `i` und `e` ein neuer Vorname entstehen. Dieses kann bspw. durch einen Buchstabendreher bei der manuellen Eingabe passieren. Dieses Vorkommen muss also gefunden werden, um eine Bewertung der Abweichung bestimmen zu können.

Um abweichende, aber nahezu identische Werte, zu finden, können aus den vorhandenen Informationen neue Vergleichswerte gebildet werden. Beispielsweise können für alle Felder über phonetische und andere Algorithmen weitere Inhalte gebildet werden.

Beispiel: Gegeben seien vier Datensätze mit Vor- und Nachname mit zusätzlichen Feldern für phonetische Laute und "normierten" Werten, um Buchstabendreher zu finden:

```
Datensatz		Vorname		Nachname	phonetische Werte	normierte Werte
Datensatz 1: 	Kerstin 	Meyer		CARSTA MAYAR		kneirst mreey
Datensatz 2: 	Kerstin 	Mayer		CARSTA MAYAR		kneirst mraey
Datensatz 3: 	Kirsten 	Meyer		CARSTA MAYAR		kneirst mreey
Datensatz 4: 	Kirsten 	Mayer		CARSTA MAYAR		kneirst mraey
```

Die zusätzlichen Werte ergänzen die realen Werte um phonetische Laute nach dem [NYSIIS Standard](https://en.wikipedia.org/wiki/New_York_State_Identification_and_Intelligence_System).

Ergänzend dazu werden normierte Werte hinzugefügt, die nach einem Algorithmus gebildet wurden, der an die Arbeit von Ernest Rawlinson, "The significance of letter position in word recognition", aus dem Jahr 1976 anknüpft. Die These der Arbeit von Rawlinson beruht auf der Behauptung, dass beim Lesen die Worte als "Muster" erkannt werden und nicht Buchstabe für Buchstabe. Daher kann ein Text auch dann gelesen werden, wenn zwischen dem ersten und letzten Buchstaben eines Wortes die Buchstaben vertauscht werden.

Der Algorithmus für die normierten Werte nach Rawlinson arbeitet in Kleinschreibung und schiebt den ersten und letzten Buchstaben an den Anfang des Wertes. Die restlichen Buchstaben werden alphabetisch sortiert dahinter aufgeführt. Aus den Vornamen `Kerstin` und `Kirsten` folgt daher immer der gleiche Wert `kneirst`.

Nach der Speicherung der ergänzenden Werte können die Datensätze nun wieder verglichen werden. Über sechs Felder wird dann auch für die phonetischen Laute und den normierten Vornamen eine Übereinstimmung festgestellt. Durch die Ermittlung ähnlicher Werte muss das Ergebnis des Vergleichs nunmehr mit einer Wahrscheinlichkeit bewertet werden, um bei der möglichen Übereinstimmung ähnlicher Datensätze einen Link zu setzen. Hierin liegt der manuelle Aufwand und die eigentliche Kunst des record linkage.

Nutzung der CortexDB
--------------------

Die CortexDB lässt eine schemalose Speicherung der Inhalte je Datensatz zu. Daher können beliebige viele Werte in einem Datensatz gespeichert und auch andere Algorithmen für die Erzeugung weiterer Werte herangezogen werden (z.B. weitere phonetische oder normierte Werte).

Damit direkt bei der Transaktion eines Datensatzes ergänzende Werte erzeugt und gespeichert werden können, steht von der Datenbank aus die Funktion der sog. `Reporter` zur Verfügung. Diese erlauben durch eine einfache Konfiguration die Ablage von Algorithmen (in Form von JavaScript-Code) innerhalb der Datenbank. Beispielsweise können die phonetischen Werte je Feld ermittelt und in weitere Felder geschrieben werden. Jeder Reporter wird dabei für genau ein Regelwerk und ein Ergebnisfeld genutzt. Sollen also für mehrere Felder phonetische, normierte und andere Werte ermittelt werden, sind jeweils einzelne Reporter zu definieren.

Für die Durchführung des record linkage werden dann die "echten" Feldinhalte, wie auch die Feldinhalte der Reporter-Felder herangezogen. In der Konfiguration des record linkage sind diese Vergleichsfelder und die Gewichtung zu konfigurieren.

Beispiel des record linkage für CortexDB
----------------------------------------

Der hier vorliegende Code dient nur als funktionsfähiges Beispiel (Prototyp) zur Durchführung eines record linkage auf Basis der CortexDB. Durch die 6. Normalform (Feldindex) der CortexDB können beliebig viele Felder miteinander verglichen werden. Es ist keinerlei Anpassung an der Datenbankkonfiguration notwendig.

Dieses beispiel des record linkage lässt die Konfiguration mehrerer Regeln zu. In jeder Regel müssen folgende Parameter eingestellt werde:

- ein Suchstring zum Auffinden der Ausgangsdatensätze
- ein Array mit den Feldern zum Vergleich aus den Ausgangsdatensätzen
- ein Array mit den zu vergleichenden Feldern (gleiche Anzahl der Felder wir zuvor)
- eine Gewichtung des Ergebnisses je Feldvergleich (probabilistisch)
- die Angabe, wieviel Felder mindestens vollständig übereinstimmen müssen (deterministisch)
- Mindestpunkte (%) um einen Link in einen Datensatz zu schreiben
- Linkfeld für das Ergebnis (Wiederholfeld)
- Ergebnisfeld für Link (Wiederholfeld)
- ein bool'scher Werte, ob alle Links geschriebene werden, auch wenn schon ein Link mit 100% vorliegt

```
"searchVal"     : {"v": [ { "m" : "+", "t" : "s", "f" : "chkStat", "w" : "*", "v" : ["1"]} ]},
'fields'        : ['NameL', 'NameF', 'Street', 'HsNum', 'ZipCode', 'City'],
'search_fields' : ['KANAML', 'KANAMF', 'KASTR', 'KAHNR', 'KAZIP', 'KACTY'],
'weight'        : [50, 50, 50, 50, 50, 50],
"minNumEQfields": 3,
"minPercEQ"     : 85,
'linkField'     : '@pLink',
'linkProb'      : 'pValue',
'strict'        : false
```

Wie im vorliegenden Code zu ersehen ist, können mehrere Regeln in der Konfiguration hinterlegt werden. Die Suche und das Verlinken über verschiedene Felder und Datensätze ist also möglich.

Hinweis
-------

Der vorliegende Code kann beliebig ergänzt und an eigene Bedürfnisse angepasst werden.

Ergänzend zu der Suche über den Feldindex (6. Normalform) ist es auch möglich, beliebige reguläre Ausdrücke für die Suche und den Vergleich je Feldinhalt zu nutzen.

