import numpy as np
import numba as nb

class ReaderDAS:
        
    @nb.njit(nogil=True, parallel=True)
    def detrend(self, data):
        """Detrend the data (parallel version)
        
        For each channel, a trend is approximated using the first and last data point. While not as accurate as linear regression, it is much faster. This first order trend correction facilitates subsequent corrections with lowpass or bandpass filters.
        
        Since this operation is applied to each channel individually, it can be easily parallelised using `numba.njit`.
        
        Parameters
        ----------
        
        data : `numpy.array`
            Input data to be detrended
        
        Returns
        -------
        
        detrended : `numpy.array`
            Detrended data
        
        """
        Nch, Nt = data.shape
        trend = np.linspace(0, 1, Nt)
        detrended = np.zeros_like(data)
        for i in nb.prange(Nch):
            d = data[i]
            minmax = d[-1] - d[0]
            d = d - trend * minmax
            detrended[i] = d - np.mean(d)
        
        return detrended


    def _process_header(self, header):
        """Extract the relevant contents from the header list """
        
        header_dict = {
            "FileHeaderSize": int(header[0]),
            "gauge": header[1],
            "samp": header[6] / header[15],
            "Nch": int(header[14] - header[12]),
            "timestamp": header[100],
            "mK_to_Strain": 10.,
        }
        
        return header_dict


    def read_DAS(self, filenames, dtype=np.float64, detrend_data=True, ch_slice=slice(0, None), jit=False):
        """Read one or more Toulon DAS binary files
        
        The time sampling rate and gauge length are extracted from the data headers. Optionally a per-channel detrending is applied
        
        Parameters
        ----------
        
        filenames : str, `numpy.str_`, or list
            The filename(s) of the data to be read
        dtype : `numpy.dtype`, default `numpy.float64`
            Data type contained in the data file(s)
        detrend_data : bool, default True
            Whether or not to apply detrending to the DAS channel data
        ch_slice : `slice(0, None)`, default None
            Slice indicating the range of channels to return
        jit : bool, default False
            Whether or not to parallelise using `numba.njit`
            
        
        Returns
        -------
        
        t : `numpy.array`
            Vector containing the time samples (in seconds, starting at zero)
        dist : `numpy.array`
            Vector containing the distance along the cable (in metres, starting at zero at the interrogator)
        strain : `numpy.array`
            Strain data
        samp : float
            Time sampling rate (in Hertz)
        gauge : float
            Gauge length (in metres)
            
        Notes
        -----
        
        Currently detrending is applied before instrument correction. Should this be done the other way around?
        
        """
        
        if (type(filenames) == str) or (type(filenames) == np.str_):
            filenames = [filenames]
        
        # Open data file
        with open(filenames[0], "rb") as fileID:
            fHeaderSize = int(np.fromfile(fileID, dtype=dtype, count=1)[0])
            header = [fHeaderSize] + list(np.fromfile(fileID, dtype=dtype, count=fHeaderSize-1))
        
        header_dict = self._process_header(header)
        
        Nch = header_dict["Nch"]
        samp = header_dict["samp"]
        gauge = header_dict["gauge"]
        mK_to_Strain = header_dict["mK_to_Strain"]
        timestamp = header_dict["timestamp"]
        
        offset = header_dict["FileHeaderSize"] * np.dtype(dtype).itemsize
        
        all_data = []
        
        for i, filename in enumerate(filenames):
            
            # Open data file
            with open(filename, "rb") as fileID:
                raw_file = np.fromfile(fileID, dtype=dtype, offset=offset)
        
            Nt = len(raw_file) // Nch

            strain = mK_to_Strain * raw_file.reshape((Nt, Nch)).T
            all_data.append(strain[ch_slice])
            
        strain = np.concatenate(all_data, axis=1)
        Nch, Nt = strain.shape
        
        if detrend_data:
            if jit:
                strain = self.detrend(strain)
            else:
                strain = strain.T
                trends = np.linspace(0, 1, strain.shape[0])
                trends = np.tile(trends, (strain.shape[1], 1)).T

                minmax = strain[-1] - strain[0]

                strain = strain - (trends * minmax)
                strain = strain - np.mean(strain, axis=0)
                strain = strain.T
        
        dist = np.linspace(0, gauge * (Nch - 1), Nch)
        t = np.linspace(0, (Nt - 1) / samp, Nt)

        return t, dist, strain, samp, gauge, timestamp
