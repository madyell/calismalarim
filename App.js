import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, TouchableOpacity, Dimensions, PixelRatio } from 'react-native';
import _ from 'lodash';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;

function normalize(size) {
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

const SHAPES = {
  I: {
    shape: [
      [1, 1, 1, 1],
    ],
    color: 'cyan'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'yellow'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: 'purple'
  },
  L: {
    shape: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    color: 'red'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: 'green'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: 'orange'
  },
};

const getRandomShape = () => {
  const keys = Object.keys(SHAPES);
  const shapeKey = keys[Math.floor(Math.random() * keys.length)];
  return { ...SHAPES[shapeKey], key: shapeKey };
};

const createEmptyBoard = () => {
  const rows = 20;
  const cols = 10;
  const board = [];
  for (let row = 0; row < rows; row++) {
    board[row] = [];
    for (let col = 0; col < cols; col++) {
      board[row][col] = { filled: 0, color: 'white' };
    }
  }
  return board;
};

const App = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentShape, setCurrentShape] = useState(getRandomShape());
  const [position, setPosition] = useState({ row: 0, col: 4 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [speed, setSpeed] = useState(900);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const gameInterval = setInterval(() => {
      moveShapeDown();
    }, speed);

    const updateSpeedInterval = setInterval(() => {
      if (score >= level * 100) {
        setLevel(level + 1);
        setSpeed(Math.max(speed - 50, 200));
      }
    }, 1000);

    return () => {
      clearInterval(gameInterval);
      clearInterval(updateSpeedInterval);
    };
  }, [board, currentShape, position, speed, level, score]);

  const moveShape = (deltaRow, deltaCol) => {
    if (canMove(currentShape.shape, position.row + deltaRow, position.col + deltaCol)) {
      setPosition(prev => ({ row: prev.row + deltaRow, col: prev.col + deltaCol }));
    }
  };
  
  const moveShapeDown = () => {
    if (!canMove(currentShape.shape, position.row + 1, position.col)) {
      mergeShape();
      const newShape = getRandomShape();
      const initialPosition = { row: 0, col: 4 };
      if (!canMove(newShape.shape, initialPosition.row, initialPosition.col)) {
        setGameOver(true);
      } else {
        setCurrentShape(newShape);
        setPosition(initialPosition);
      }
    } else {
      setPosition(prev => ({ ...prev, row: prev.row + 1 }));
    }
  };

  const canMove = (shape, moveRow, moveCol) => {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newRow = moveRow + row;
          const newCol = moveCol + col;
          if (
            newRow < 0 ||
            newRow >= 20 ||
            newCol < 0 ||
            newCol >= 10 ||
            !board[newRow] ||
            board[newRow][newCol] === undefined ||
            board[newRow][newCol].filled
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const mergeShape = () => {
    const newBoard = _.cloneDeep(board);
    let clearedRows = 0;
    const clearedIndexes = [];

    currentShape.shape.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        if (cell) {
          const boardRow = position.row + rowIndex;
          const boardCol = position.col + cellIndex;
          if (boardRow >= 0 && boardRow < 20 && boardCol >= 0 && boardCol < 10) {
            if (newBoard[boardRow] && newBoard[boardRow][boardCol] !== undefined) {
              newBoard[boardRow][boardCol] = {
                filled: cell,
                color: currentShape.color
              };
            }
          }
        }
      });
    });

    newBoard.forEach((row, rowIndex) => {
      if (row.every(cell => cell.filled)) {
        clearedRows++;
        clearedIndexes.push(rowIndex);
      }
    });

    const newScore = score + clearedRows ** 2 * 100;
    setScore(newScore);

    clearedIndexes.reverse().forEach(index => newBoard.splice(index, 1));

    clearedIndexes.forEach(() => newBoard.unshift(Array(10).fill({ filled: 0, color: 'white' })));

    setBoard(newBoard);
  };

  const drawBoard = () => {
    const newBoard = _.cloneDeep(board);
    currentShape.shape.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        if (cell) {
          const boardRow = position.row + rowIndex;
          const boardCol = position.col + cellIndex;
          if (boardRow >= 0 && boardRow < 20 && boardCol >= 0 && boardCol < 10) {
            newBoard[boardRow][boardCol] = {
              filled: cell,
              color: currentShape.color
            };
          }
        }
      });
    });
    return newBoard;
  };

  const rotateShape = () => {
    const rotatedShape = currentShape.shape[0].map((_, index) =>
      currentShape.shape.map(row => row[index]).reverse()
    );

    if (canMove(rotatedShape, position.row, position.col)) {
      setCurrentShape(prev => ({ ...prev, shape: rotatedShape }));
    }
  };

  const startGame = () => {
    setBoard(createEmptyBoard());
    setCurrentShape(getRandomShape());
    setPosition({ row: 0, col: 4 });
    setIsStarted(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setSpeed(500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tetrisiyum</Text>
      {isStarted ? (
        <>
          <View style={styles.boardContainer}>
            <View style={styles.board}>
              {gameOver ? (
                <View style={styles.gameOver}>
                  <Text style={styles.gameOverText}>Oyun Bitti</Text>
                  <Button title="Yeniden Başlat" onPress={startGame} />
                </View>
              ) : (
                drawBoard().map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.row}>
                    {row.map((cell, cellIndex) => (
                      <View
                        key={cellIndex}
                        style={[styles.cell, { backgroundColor: cell.color }]}
                      />
                    ))}
                  </View>
                ))
              )}
            </View>
          </View>
          <View style={styles.controlsContainer}>
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={rotateShape} style={styles.controlButton}>
                <Text style={styles.controlText}>🔄</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={() => moveShape(0, -1)} style={styles.controlButton}>
                <Text style={styles.controlText}>◀️</Text>
              </TouchableOpacity>
              <View style={styles.spacer}></View>
              <TouchableOpacity onPress={() => moveShape(0, 1)} style={styles.controlButton}>
                <Text style={styles.controlText}>▶️</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={() => moveShape(1, 0)} style={styles.controlButton}>
                <Text style={styles.controlText}>⬇️</Text>         
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <Button title="Başla" onPress={startGame} />
        
      )}
      {!isStarted && <Text style={styles.credits}>by Batuhan Demir</Text>}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Skor: {score}</Text>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    backgroundColor: 'gray',
  },
  title: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    marginBottom: normalize(5),
  },
  boardContainer: {
    width: normalize(240),
    height: normalize(480),
    borderWidth: normalize(2),
    borderColor: '#000',
    flexDirection: 'column',
    backgroundColor: 'white',
    marginBottom: normalize(5),
  },
  board: {
    flex: 1,
    flexDirection: 'column',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    borderWidth: normalize(0.5),
    borderColor: '#ddd',
  },
  controlsContainer: {
    width: '80%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(0),
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(0),
  },
  controlButton: {
    width: normalize(45),
    height: normalize(45),
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: normalize(30),
  },
  controlText: {
    fontSize: normalize(26),
  },
  spacer: {
    width: normalize(90),
  },
  infoContainer: {
    position: 'absolute',
    bottom: '5%',
    right: '5%',
    alignItems: 'center',
  },
  infoText: {
    fontSize: normalize(13),
    fontWeight: 'bold',
  },
  gameOver: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    marginBottom: normalize(20),
  },
  credits: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    fontSize: normalize(14),
    color: 'black',
  },
});
export default App;
