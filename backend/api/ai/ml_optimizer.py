from sklearn.linear_model import LinearRegression
import numpy as np

model = LinearRegression()

X = np.array([[9], [12], [18], [21]])
y = np.array([8, 6, 9, 4])

model.fit(X, y)

def optimize_time(hour):

    score = model.predict([[hour]])

    return score[0]