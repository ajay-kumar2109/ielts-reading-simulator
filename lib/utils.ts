export const calculateBand = (correctAnswers: number, totalQuestions: number = 40): number => {
  const bandScoreMap: { [key: number]: number } = {
    40: 9.0, 39: 9.0,
    38: 8.5, 37: 8.5,
    36: 8.0, 35: 8.0,
    34: 7.5, 33: 7.5,
    32: 7.0, 31: 7.0, 30: 7.0,
    29: 6.5, 28: 6.5, 27: 6.5,
    26: 6.0, 25: 6.0, 24: 6.0, 23: 6.0,
    22: 5.5, 21: 5.5, 20: 5.5, 19: 5.5,
    18: 5.0, 17: 5.0, 16: 5.0, 15: 5.0,
    14: 4.5, 13: 4.5, 12: 4.5,
    11: 4.0, 10: 4.0, 9: 4.0,
    8: 3.5, 7: 3.5, 6: 3.5,
    5: 3.0, 4: 3.0,
    3: 2.5, 2: 2.5,
    1: 2.0, 0: 1.0
  }
  
  return bandScoreMap[correctAnswers] || 1.0
}

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
