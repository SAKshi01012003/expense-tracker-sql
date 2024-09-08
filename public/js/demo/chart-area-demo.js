document.addEventListener('DOMContentLoaded', () => {
  // Fetch monthly expenses growth data
  fetch('/monthly-expenses-growth')
      .then(response => response.json())
      .then(data => {
          const months = data.map(row => row.month);
          const growths = data.map(row => row.growth);

          const ctxA = document.getElementById('myAreaChart').getContext('2d');
          new Chart(ctxA, {
              type: 'line',
              data: {
                  labels: months,
                  datasets: [{
                      label: 'Month-over-Month Growth (%)',
                      data: growths,
                      backgroundColor: 'rgba(78, 115, 223, 0.2)',
                      borderColor: 'rgba(78, 115, 223, 1)',
                      borderWidth: 2,
                      fill: true
                  }]
              },
              options: {
                  scales: {
                      x: {
                          beginAtZero: true
                      },
                      y: {
                          beginAtZero: true,
                          ticks: {
                              callback: function(value) {
                                  return value + '%';
                              }
                          }
                      }
                  }
              }
          });
      });
});
